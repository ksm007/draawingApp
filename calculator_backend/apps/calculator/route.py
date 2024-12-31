from fastapi import APIRouter, HTTPException
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post('')
async def run(data: ImageData):
    try:
        print('entered router')
        image_data = base64.b64decode(data.image.split(",")[1])  # Assumes data:image/png;base64,<data>       
        image_bytes = BytesIO(image_data)
        image = Image.open(image_bytes)
        responses = analyze_image(image, dictionary_of_vars=data.dictionary_of_vars)
        data = []
        for response in responses:
            data.append(response)
        print('response in route: ', response)
        return {"message": "Image processed", "data": data, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

