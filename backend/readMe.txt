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
    'PASSWORD': "1949Com5Ln",
    'HOST': "localhost",
    'PORT': "5432",
    "OPTIONS": {
        "isolation_level": IsolationLevel.SERIALIZABLE,
    },
}

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

# Time to build out the database in model.py
# Create an app in django that will house all the views. 
python manage.py startapp base
# add to setting.py file to be picked up and used
"base.apps.BaseConfig", -- "base" is the app name

# create models.py /tables in the database
python manage.py makemigrations
python manage.py migrate 
python manage.py runserver

########################################
# React time
# set up react and get the user login setup.
# Node Js is installed for react
npx create-reacte-app frontend






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

########################################
# Deploy
########################################