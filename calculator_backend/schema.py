from pydantic import BaseModel

class ImageData(BaseModel):
    image: str
    dictionary_of_vars: dict