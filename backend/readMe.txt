# create folder structure
project_name>frontend
project_name>backend

#create enviroment with conda
conda create -n ladder python=3.14
# Get the backend setup and running.
pip install python-dotenv
pip install django # django 6.0
pip install djangorestframework
# create project
django-admin startproject ladder
# run test
python manage.py runserver

# add requirment packages
pip install pillow
# install params and settings
pip install django-cors-headers
# JWT - add setting params
pip install djangorestframework-simplejwt
pip install requests

# Install postgres
pip install postgres
pip install psycopg
# set the correct environmental variable. 
$env:PATH = "$env:PATH;C:\Program Files\PostgreSQL\18\bin"
psql -U postgres -d ecommerce -h localhost
# create database
CREATE DATABASE ladder;
# add to django settingpy file 
"default": {
    "ENGINE": "django.db.backends.postgresql",
    'NAME': "ladder",
    'USER': "postgres",
    'PASSWORD': "1949**",
    'HOST': "localhost",
    'PORT': "5432",
    "OPTIONS": {
        "isolation_level": IsolationLevel.SERIALIZABLE,
    },
}
# set image upload folder structure
# setting.py
#############
add folders /static/images <<<<<<<<<<<<<<
#############
STATICFILES_DIRS = [
    BASE_DIR / "static",
    # BASE_DIR / "frontend/build/static"
    ]
MEDIA_ROOT = "static/images"



# Create an app in django that will house all the views. 
python manage.py startapp base
# add to setting.py 
"base.apps.BaseConfig",

# check all the settings and imports are correct
# run test
python manage.py makemigrations
python manage.py migrate 
python manage.py runserver

# at this point your backend sever is running and connected to the postgres database locally. 
# link pgAdmin to database
python manage.py createsuperuser
melowise5@gmail.com
1949---

open pgAdmin4
view/edit data > All Rows

####
# React time
# set up react and get the user login setup.
# Node Js is installed for react
npx create-reacte-app frontend
npm install axios
npm install redux
npm install redux-thunk
npm install react-redux
npm install charts.js react-chartjs-2
npm install chartjs-plugin-annotation
npm start

# now both front and back end are created. 
# adding place holder so apis calls are cleaner
go to package.json
under "name"
add "proxy": "http://127.0.0.1:8000"


####
# git hub
conda install github -c conda-forge
git init
git add .
git commit -m "First commit – ready for production"
git branch -M main
git remote add origin https://github.com/MeloWise5/ladder.git
git push -u origin main

//Update
git add .
git commit -m "describe your change in 5-10 words"
git push

/// requirements
pip freeze > requirements.txt
git add requirements.txt
git commit -m "add requirements"
git push

#### bootstrap
npm install react-bootstrap
# https://fontawesome.com/v6/search
npm install @fortawesome/fontawesome-free
import '@fortawesome/fontawesome-free/css/all.min.css';
# react router for navigating
npm install react-router-dom
npm install react-router-bootstrap





















########################################
# Conda
########################################
# view all envs on system
conda env list
conda info --envs

# creating env 
---- best to set the python version here
conda create -n myenv python=3.14

########################################
# Postgres
########################################

########################################
# Django
########################################
# install
pip install django
pip install djangorestframework
# create project
django-admin startproject mysite

# run server
python manage.py runserver

POSTMAN desktop app - local testing of the api and authentication
#CORS for cross browser support. from the react project to the django project
pip install django-cors-headers


########################################
# React
########################################
npx create-reacte-app frontend
npm start
npm build
npm test
npm run eject

####
# Free Templates bootstrap
# https://bootswatch.com/
# https://bootswatch.com/cerulean/
# download .min.css file
# install the css file in teh index.js

npm install react-bootstrap

########################################
# Deploy
########################################
# be inside the folder youre working on.
conda install git --channel conda-forge -y
git --version

the initial push to github. make sure its completley empty. 
git init
git add .
git commit -m "First commit – ready for production"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main

//Update
git add .
git commit -m "describe your change in 5-10 words"
git push

/// requirements
pip freeze > requirements.txt
git add requirements.txt
git commit -m "add requirements"
git push

// uploading to Deplyment folder
git clone https://github.com/MeloWise5/ecom.git .

// get new code
git pull






# Script
pip install pytz
pip install rich
pip install coinbase
pip install coinbase-advanced-py