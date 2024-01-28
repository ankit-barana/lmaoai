import os
from fastapi import FastAPI, File, UploadFile
from starlette.middleware.cors import CORSMiddleware
import io
import asyncio
import pdfplumber
import openai
from dotenv import load_dotenv
from app.api import get_answer, get_question
from app.logger import logger
from pydantic import BaseModel
from app.ocr import get_text_from_pdf, get_text_from_docx, get_text_from_image
from typing import List
import requests
import re

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


app = FastAPI()


allow_all = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_all,
    allow_credentials=True,
    allow_methods=allow_all,
    allow_headers=allow_all,
)

GET_QUESTION_PROMPT = """
I want to convert the Scanned PDF document to List of texts section. The document will contain questions, questions can be "Wh" type question or it may analytical which can contain some background too.There can be multiple choice questions so you must include Options in the question.I want you to give me List of question from that document ignoring header, footer and meta information present in that document. Make sure you include all the context and and options if there are any. Separate each question by new line  and "||" string. Do not inculde any additional text except questions itself. Here is the result of OCR:\n\n
"""

GET_ANSWER_SINGLE_QUESTION_PROMPT = f"""
Please give me the answer to the question below without additional text. <MAX_WORDS> Here is the question:\n\n
"""


@app.post("/get_questions")
async def get_questions(file: UploadFile = File(...), only_ocr: bool = True):
    try:
        pages_of_text = []
        if file.filename.endswith(".pdf"):
            pages_of_text = await get_text_from_pdf(file)
        elif file.filename.endswith(".docx"):
            pages_of_text = await get_text_from_docx(file)
        elif any(file.filename.endswith(ext) for ext in [".jpg", ".jpeg", ".png"]):
            # since there will be only one image, we put it in array to make it consistent with other file types
            pages_of_text = [await get_text_from_image(file)]

        tasks = [
            get_question(
                prompt=GET_QUESTION_PROMPT, ocr_text=page_of_text, only_ocr=only_ocr
            )
            for page_of_text in pages_of_text
            if len(page_of_text) > 0
        ]
        final_response = await asyncio.gather(*tasks)
        # flatten questions
        questions = [item for sublist in final_response for item in sublist]
        questions = [question for question in questions if len(question) > 3]
        logger.info(f"Got questions {questions}")

        single_str = ""
        pattern = r"^\d+\."

        question_no = 1
        for sublist in final_response:
            for question in sublist:
                question = question.strip()
                if len(question) > 3:
                    logger.info(f"Got question {question}")
                    if re.match(pattern, question):
                        single_str += question + "\n\n"
                    else:
                        single_str += str(question_no) + ". " + question + "\n\n"
                question_no += 1

        return {"message": [single_str], "error": None}
    except Exception as e:
        logger.error(e)
        return {"error": str(e), "message": None}


class GetAnswersRequest(BaseModel):
    questions: List[str]
    max_words: int = None


@app.post("/get_answers")
async def get_answers(req: GetAnswersRequest):
    #  if there is decimal no of beginning of question, remove newline
    decimal_no_beginning = r"\n\s*\d+\.\d+"
    questions = req.questions[0]

    matches = re.finditer(decimal_no_beginning, questions)
    for match in matches:
        questions = questions[: match.start()] + " " + questions[match.start() + 1 :]

    # any number of space and number and dot at the beginning of line
    pattern = r"^\s*\d+\."
    questions = re.split(pattern, questions, flags=re.MULTILINE)[1:]
    logger.info(f"Getting answers for questions {questions}")
    try:
        tasks = [
            get_answer(
                question.strip(),
                GET_ANSWER_SINGLE_QUESTION_PROMPT,
                max_words=req.max_words,
            )
            for question in questions
            if len(question.strip()) > 0
        ]
        final_response = await asyncio.gather(*tasks)

        result = [
            {"question": r["question"], "answer": r["answer"]}
            for r in final_response
            if len(r["answer"]) > 0
        ]
        logger.info(
            f"Total:{len(final_response)}, Failed : {len(final_response)-len(result)}"
        )
        return {"message": result, "error": None}
    except Exception as e:
        logger.error(e)
        return {"error": str(e), "message": []}


@app.post("/pdf_to_answers")
async def pdf_to_answers(file: UploadFile = File(...)):
    """
    Convert PDF to text and then get answers for each question
    PDF should be searchable
    """
    pdf = pdfplumber.open(io.BytesIO(await file.read()))
    # Extract text from each page
    text = ""
    for page in pdf.pages:
        text += page.extract_text()

    questions = get_questions(prompt=GET_QUESTION_PROMPT, ocr_text=text)

    tasks = [
        get_answer(question, GET_ANSWER_SINGLE_QUESTION_PROMPT)
        for question in questions
        if len(question) > 0
    ]
    logger.info("Getting answers for questions")
    final_response = await asyncio.gather(*tasks)
    logger.info(final_response)

    return {"answers": final_response}
