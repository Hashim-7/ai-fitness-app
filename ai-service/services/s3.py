import os

import boto3
from dotenv import load_dotenv

load_dotenv("../backend/.env")


s3 = boto3.client(
    "s3",
    region_name=os.environ["AWS_REGION"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
)


def get_image_bytes(s3_key: str) -> bytes:
    response = s3.get_object(
        Bucket=os.environ["AWS_BUCKET_NAME"],
        Key=s3_key,
    )

    return response["Body"].read()