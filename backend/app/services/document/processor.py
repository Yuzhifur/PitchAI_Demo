# File: backend/app/services/document/processor.py

from typing import List
import os
from pathlib import Path

class DocumentProcessor:
    def __init__(self):
        pass

    async def extract_text_from_pdf(self, file_path: str) -> str:
        """
        SIMPLIFIED: Just validate the file exists and return a placeholder
        In the future, this would extract actual text using PyPDF2 or similar
        """
        try:
            file_path_obj = Path(file_path)

            # Check if file exists
            if not file_path_obj.exists():
                raise FileNotFoundError(f"PDF file not found: {file_path}")

            # Check file size
            file_size = file_path_obj.stat().st_size
            if file_size == 0:
                raise ValueError("PDF file is empty")

            # Check if it's actually a PDF (basic check)
            with open(file_path, 'rb') as f:
                header = f.read(8)
                if not header.startswith(b'%PDF'):
                    raise ValueError("File is not a valid PDF")

            print(f"✅ PDF validation successful: {file_path} ({file_size} bytes)")

            # PLACEHOLDER: Return a mock extracted text
            # In real implementation, this would use PyPDF2 or pdfplumber
            return f"""
            商业计划书文档已成功上传
            文件大小: {file_size} 字节

            注意：当前为简化版本，文档内容需要人工评审。

            项目概述：
            - 文档格式验证：通过
            - 文件完整性：正常
            - 等待人工评审...

            此文档已准备好进行人工评分和评审。
            """

        except Exception as e:
            raise Exception(f"Failed to validate PDF file: {str(e)}")

    def chunk_text(self, text: str, chunk_size: int = 4000, overlap: int = 200) -> List[str]:
        """Split text into manageable chunks - simplified version"""
        if not text:
            return []

        chunks = []
        text_length = len(text)

        if text_length <= chunk_size:
            return [text]

        start = 0
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

    def validate_pdf_file(self, file_path: str) -> bool:
        """Validate if file is a proper PDF"""
        try:
            file_path_obj = Path(file_path)

            if not file_path_obj.exists():
                return False

            # Basic PDF header check
            with open(file_path, 'rb') as f:
                header = f.read(8)
                return header.startswith(b'%PDF')

        except Exception:
            return False

# Global instance
document_processor = DocumentProcessor()