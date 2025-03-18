# Files
If its in an index.html, its code for frontend, if in main.py then it needs to be run in backend

## Compreface
Probably most complex one to run, compreface is a separate server that runs locally on docker and communicates with other apps through its api,
run 
Download the Compreface_1.2.0.zip from https://github.com/exadel-inc/CompreFace/releases and extract it somewhere safe(maybe inside the project folder itself)

 `$ cd /path/inside/extracted/directory` - to make sure you are inside the directory
 `$ docker-compose up -d` - creates and runs the docker file

Now,
You can stop or start the server inside the docker app otherwise it'll keep running

open https://localhost:8000,
Login with an account
Create a new Application, Give it whatever name and choose **"Verification"**
Now go back to homepage, click on the application and copy the api key and paste for **VERIFICATION_API_KEY**

before running the python file just create the venv and install compreface-sdk and its requirements

`$ python -m venv .venv`
`$ ./.venv/scripts.activate`
`$ pip install compreface-sdk requests_toolbelt urllib3 `

Run the main.py with `$python main.py`

>**Important:** The ***me.jpg*** is used as reference here which is compared with the latest image in the ***uploads folder***, this folder is special because it'll be used by other modules too to populate / fill it with photos from the video feed

## live speech module
Uses the browser's inbuilt APIs for transcription, **this one needs internet** shouldn't be too hard to understand but there are settings that you'd wanna ask chatgpt about, make sure you understand what those settings and keywords are for, **those keywords are important** and we might need to change them manually later for it to properly work with the backend

## video transfer module
Frontend and backend which send images from the video every 5 seconds to backend and saves in the ***uploads folder***, you can maybe ask chatgpt to change the backend so instead of keep adding more images it'll just keep overwriting the original one without the timestamp in its name.
Rerun these commands in this folder to run it
`$ python -m venv .venv`
`$ ./.venv/scripts.activate`
`$ pip install flask-cors`

# Stuff left to do

- Card verification and OCR
- Check if Gemini api can return audio directly with text otherwise make it send it to any medium quality text to speech, its a prototype so audio quality isnt too important
- Creating the flow in the main website
- Loan eligibility rules (check the shitty diagram I made )