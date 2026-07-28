import boto3
import tempfile
from pathlib import Path

from core.config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_BUCKET_NAME,
)

s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


def download_file(s3_key: str) -> Path:
    """
    Downloads an S3 object into a temporary file.

    Returns:
        Path to the downloaded file.
    """

    suffix = Path(s3_key).suffix

    tmp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    )

    s3.download_fileobj(
        Bucket=AWS_BUCKET_NAME,
        Key=s3_key,
        Fileobj=tmp,
    )

    tmp.close()

    return Path(tmp.name)