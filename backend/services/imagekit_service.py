import logging
from imagekitio import ImageKit
from config import IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT

logger = logging.getLogger(__name__)

ik = ImageKit(
    public_key=IMAGEKIT_PUBLIC_KEY,
    private_key=IMAGEKIT_PRIVATE_KEY,
    url_endpoint=IMAGEKIT_URL_ENDPOINT
)

async def upload_file(file_bytes: bytes, filename: str) -> str:
    """
    Upload file bytes to ImageKit and return the URL.
    """
    try:
        upload = ik.upload(
            file=file_bytes,
            file_name=filename,
        )
        return upload.url
    except Exception as e:
        logger.error(f"Error uploading to ImageKit: {e}")
        raise e
