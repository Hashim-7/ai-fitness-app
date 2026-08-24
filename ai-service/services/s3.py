import os

import boto3
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv("../backend/.env")


s3 = boto3.client(
    "s3",
    region_name=os.environ["AWS_REGION"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
)


def get_image_bytes(s3_key: str) -> bytes:
    """Fetch an image from S3 and return its raw bytes.

    If the object does not exist or AWS returns an error, we raise a
    ``fastapi.HTTPException`` with status code 400 so the caller can
    return a clear client error instead of a generic 500.
    """
    try:
        response = s3.get_object(
            Bucket=os.environ["AWS_BUCKET_NAME"],
            Key=s3_key,
        )
        return response["Body"].read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch S3 object: {e}")