import asyncio
import openai
from app.logger import logger
from functools import partial
import os
import time


def is_valid_question(question):
    valid_length = len(question) > 3
    cotains_sorry = "sorry" in question.lower()
    contains_language_model = "language model" in question.lower()
    return valid_length and not cotains_sorry and not contains_language_model


def validate_answer(answer):
    cotains_sorry = "sorry" in answer.lower()
    contains_language_model = "language model" in answer.lower()
    if not cotains_sorry and not contains_language_model:
        return answer
    else:
        return "Sorry I can only answer text based questions that are ethical"


async def get_question(prompt, ocr_text, only_ocr=False):
    logger.info("Creating questions from text")
    logger.info(ocr_text)
    env = os.getenv("ENVIRONMENT")
    if os.getenv("ENVIRONMENT") == "TEST":
        return [
            "What is the name of the company1?",
            "What is the name of the company2?",
            "What is the name of the company3?",
            "What is the name of the company4?",
        ]
    if only_ocr:
        return [ocr_text]

    loop = asyncio.get_running_loop()
    num_retries = int(os.getenv("NUM_RETRIES_QUESTION", 3))
    timeout = int(os.getenv("TIMEOUT_QUESTION", 30))
    for i in range(num_retries):
        try:
            start_time = time.time()
            questions_text = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    partial(
                        openai.ChatCompletion.create,
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": prompt + ocr_text}],
                    ),
                ),
                timeout=timeout,  # set timeout to 60 seconds
            )
            logger.info(
                f"Time taken to get questions {time.time() - start_time} seconds"
            )
            questions_text = questions_text["choices"][0]["message"]["content"]
            questions = questions_text.split("||")
            logger.info("Questions from chatgpt: " + questions_text)
            if len(questions) < 3:
                questions_text == questions_text.replace("||", "")
                questions = questions_text.split("\n\n")
                if len(questions) < 4:
                    questions = questions_text.split("\n")

            return [question for question in questions if is_valid_question(question)]
        except asyncio.TimeoutError as e:
            logger.error(
                f" Timeout Error took more than {time.time() - start_time} seconds while extracting question"
            )
            logger.error(e)
        except Exception as e:
            logger.error(f"Error while creating questions")
            logger.error(e)
    logger.error(f"Max {num_retries} retries reached for creating questions")
    return []


async def get_answer(question, prompt, max_words=None):
    if os.getenv("ENVIRONMENT") == "TEST":
        return {"question": question, "answer": "This is a test answer"}

    logger.info(f"Getting answer for question {question}")
    if max_words:
        prompt = f"Limit the answer to {max_words} words. for the question below \n\n"

    else:
        prompt = ""

    logger.info(f"Prompt is {prompt}")

    loop = asyncio.get_running_loop()
    num_retries = int(os.getenv("NUM_RETRIES_ANSWER", 3))
    timeout = int(os.getenv("TIMEOUT_ANSWER", 30))
    for i in range(num_retries):
        try:
            start_time = time.time()
            answer_text = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    partial(
                        openai.ChatCompletion.create,
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": prompt + question}],
                    ),
                ),
                timeout=timeout,  # set timeout to 60 seconds
            )
            logger.info(f"Time taken to get answer {time.time() - start_time} seconds")
            answer = answer_text["choices"][0]["message"]["content"]
            logger.info(f"Answer for question {question} is {answer}")
            return {"question": question, "answer": validate_answer(answer)}
        except asyncio.TimeoutError as e:
            logger.error(
                f" Timeout Error took more than {time.time() - start_time} seconds while getting answer for question, skipping:  {question}"
            )
            logger.error(e)
        except Exception as e:
            logger.error(
                f"Error while getting answer for question {question} , Returning..."
            )
            logger.error(e)
            return {"question": question, "answer": ""}
        logger.error(f"Max {num_retries} retries reached for getting answer")
        return {"question": question, "answer": "", "failed": True}


async def test():
    questions = [
        "What is the capital of India?",
        "What is the capital of USA?",
        "What is the capital of China?",
        "What is the capital of Japan?",
    ]
    tasks = []
    for question in questions:
        task = asyncio.create_task(
            get_answer(
                question,
                "Please answer following question, also include detail and history so that answer is about 200 words: \n",
            )
        )
        tasks.append(task)

    final_response = await asyncio.gather(*tasks)
    # return final_response
    print(final_response)


def get_question_from_ocr(ocr_text, promt):
    questions_text = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": promt + ocr_text}],
    )

    questions = questions_text["choices"][0]["message"]["content"].split("||")
    if len(questions) < 4:
        questions = questions_text["choices"][1]["message"]["content"].split("\n\n")

    logger.info(f"Questions created {questions}")

    return {"questions": questions}


if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")

    GET_QUESTION_PROMPT = """
I have a requirement that I want to convet the Scanned PDF document to list of texts section. The document will contain questions, questions can be "Wh" type question or it may analytical which can contain some background too. Questions may also have options.I want you to give me List of question from that document ignoring header, footer and meta information present in that document. Make sure you include all the context and and options if there are any. Separate each question by new line and "||" string. Here is the result of OCR:\n\n
"""
    questions = get_question_from_ocr(ocr_text=ocred_text, promt=GET_QUESTION_PROMPT)
    a = [
        "a) What is computer program? Discuss in brief about different generation of programming languages.\nb) Why is algorithm and flow chart development important in problem solving? Write an algorithm and draw flow chart to test a number entered by user whether it is even or not.\n",
        "\na) What is the identifier? What are the ways to give value to variable? Explain with example?\nb)Explain about input and output function available in C with syntax and example of each part.\n",
        "\na) Write algorithm, draw flow chart and program to input a number check it is Armstrong or not.\nb) What do you mean by selective and repetitive statement? Why do we need break and continue statement?\n",
        '\na) What do you mean by "call by value and call by reference"? Explain it with suitable example.\nb) Can we pass whole array element from the function? Write the program to pass an array to the function and sort them.\n',
        "\na) Write a program that finds the largest word in a given sentence.\nb) Differentiate between the methods of passing argument to function with example. What are their advantages and disadvantages?\n",
        "\nWhat is structure? Why is it necessary? Write a program to add two distances given in feet and inch format using structure.\n",
        '\na) What is null pointer? What will be the output of the following program, explain.\n#include<stdio.h>\nint main() {\n    if( \' NULL )\n        printf("C programming is easy");\n    else\n        printf("C programming is not easy");\n    return 0;\n}\nb) Write a program to calculate the length of string without using string handling function.\n',
        "\nA file name employee.txt stores employee name, employee id and employee salary. Write a program to display the detail of all employees in the order of their salary.\n",
        "\nWrite a program in FORTRAN to read 10 integers from the user and sort them in ascending.",
    ]
