from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import io
import base64
from PIL import Image
from fashn_vton import TryOnPipeline
import torch

app = FastAPI()

# Enable CORS so the frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the pipeline globally (loads models into GPU memory)
print("Initializing FASHN VTON Pipeline...")
pipeline = TryOnPipeline(weights_dir="./weights")
print("Pipeline ready!")

@app.post("/api/tryon")
async def tryon(
    person_image: UploadFile = File(...), 
    garment_image: UploadFile = File(...),
    category: str = Form("tops"),
    is_flat_lay: bool = Form(True)
):
    try:
        # 1. Load images from the request
        person_bytes = await person_image.read()
        garment_bytes = await garment_image.read()
        
        person_img = Image.open(io.BytesIO(person_bytes)).convert("RGB")
        garment_img = Image.open(io.BytesIO(garment_bytes)).convert("RGB")
        
        # 2. Run inference
        print(f"Running inference for {person_image.filename} (Category: {category}, Flat-lay: {is_flat_lay})...")
        result = pipeline(
            person_image=person_img,
            garment_image=garment_img,
            category=category,
            garment_photo_type="flat-lay" if is_flat_lay else "model",
            num_timesteps=50,
            guidance_scale=2.5,
        )
        
        # 3. Convert result image to base64 string
        output_image = result.images[0]
        buffered = io.BytesIO()
        output_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {"result_image": img_str}
        
    except Exception as e:
        print(f"Error during inference: {str(e)}")
        return JSONResponse(status_code=500, content={"message": str(e)})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
