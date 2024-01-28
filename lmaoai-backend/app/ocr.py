import pytesseract
from pdf2image import convert_from_path, convert_from_bytes
from pypdf import PdfReader
from app.logger import logger
import tempfile
import subprocess
from PIL import Image


def is_searchable_pdf(filename):
    with open(filename, "rb") as f:
        pdf = PdfReader(f)
        doc_info = pdf.metadata
        return "/OCProperties" in doc_info


def get_text_from_pdf_path(filename):
    pages = convert_from_path(filename, 500, fmt="jpeg")

    final_text = []
    for page in pages:
        text = pytesseract.image_to_string(page, lang="eng", config="--psm 1")
        final_text.append(text)
    return final_text


async def get_text_from_pdf(file):
    pages = convert_from_bytes(await file.read(), 500, fmt="jpeg")
    final_text = []
    for page in pages:
        text = pytesseract.image_to_string(page, lang="eng", config="--psm 1")
        final_text.append(text)
    return final_text


async def get_text_from_docx(file):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    cmd = f"abiword --to=pdf {tmp_path}"
    subprocess.run(cmd, shell=True)

    final_text = get_text_from_pdf_path(f"{tmp_path}.pdf")
    return final_text


async def get_text_from_image(file):
    with Image.open(file.file) as image:
        # Convert the image to JPEG format
        with image.convert("RGB") as converted:
            # Extract text from the converted image
            text = pytesseract.image_to_string(converted, lang="eng", config="--psm 1")
    return text


if __name__ == "__main__":
    from subprocess import run

    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".docx") as tmp:
        tmp.write(b"test")
        tmp_path = tmp.name

    tmp_path = "../test1.docx"
    cmd = f"abiword --to=pdf {tmp_path}"
    run(cmd, shell=True)
