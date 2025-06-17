import PyPDF2
from typing import List
import os

class DocumentProcessor:
    def __init__(self):
        pass

    async def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")

    def chunk_text(self, text: str, chunk_size: int = 4000, overlap: int = 200) -> List[str]:
        """Split text into manageable chunks"""
        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = start + chunk_size
            if end > text_length:
                end = text_length

            chunk = text[start:end]
            chunks.append(chunk)

            if end == text_length:
                break

            start = end - overlap

        return chunks

document_processor = DocumentProcessor()