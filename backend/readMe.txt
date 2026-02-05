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

#########################################################
######################################################### going live
#########################################################
# hash router. 
on port 8000 when we do a hard refesh the react router we have an issue
since when react moves through its pages it never reloads the page just componente. 
A hard refersh make react have an issue when your on a page other than /
if you are on /products/13. On the hard refresh react does not know how to handle the url
we use the # symbol in the url so django does not think its a hardcoded url. 
This allows django to server the templetview correcly which holds the build project. 
This will allow react to correctly navigate the url to the correct page. 
# app.js
import { HashRouter as Router, Routes, Route } from "react-router-dom";
#########################################################
## going live. long description
# Merging project to django
# Grab the frontend folder. Place it into the backend folders
CD /backend/frontend/ 
npm run build

# Configure setting.py django to point to the newly added build folder
# open setting.py
import os
TEMPLATES = [
    {
        *****
        "DIRS": [
            # Let django know where the home page is located
            os.path.join(BASE_DIR, "frontend/build")
        ],
        *******
    },
]

# open urls.py
from django.views.generic import TemplateView

urlpatterns = [
    ******
    path("", TemplateView.as_view(template_name="index.html")),
    ******
]

# open setting.py
# configuring the static files for our js and css files

STATICFILES_DIRS = [
    BASE_DIR / "static",
    BASE_DIR / "frontend/build/static"
    ]

######
# react is now linked to django
# locally you can start the django project 
# python manage.py runserver
# and on port 8000 your react project will be there. 
######
# react changes. 
# run build again and the django port 8000 will reflect the changes.


##### VPS
psql -U melowisev -d ecommerce
CREATE DATABASE ladder;
pass 1949****

###### setting.py
# update database credentials .env

###### populate the live database with table
# locally run 
python manage.py migrate

# create a user on the new live database. 
# make sure the username is an email address.
python manage.py createsuperuser
melowise5@gmail.com
1949---

open pgAdmin4
view/edit data > All Rows

###### setting.py
# update allowed_hosts['your_url','yourip'] 

########################################### collect static
###### setting.py
# collect static
MEDIA_ROOT = BASE_DIR / "static/images"
STATIC_ROOT = BASE_DIR / "staticfiles"

###### urls.py
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

pip install whitenoise

###### setting.py
MIDDLEWARE = [
    "whitenoise.middleware.WhiteNoiseMiddleware",
]

###### Run collection command
# folder ladder/backend/
python manage.py collectstatic

###### setting.py
# when debug is true the system will grab from teh static file. when not in debug
# they system will grab from teh staticfiles folder
DEBUG = False

###### gunicorn
## ladder/backend/ folder
pip install gunicorn

#######################################
### requirements
pip freeze > requirements.txt
git add requirements.txt
git commit -m "add requirements"
git push

#######################################
### final commit
# go to the backend folder
git add .
git commit -m ""
git push 

## VPS server
site/ - the folder where the github is pulled into

git clone https://github.com/MeloWise5/ladder.git

// get new code
git pull


###############################################
###### Nginx : 80 ( System service outside the env)
###############################################
# Setting Nginx settings
sudo nano /etc/nginx/conf.d/default.conf
# add server block
Save: Press Ctrl+O (that's the letter O, not zero), then press Enter to confirm
Exit: Press Ctrl+X

# reload system 
sudo nginx -t && sudo systemctl reload nginx

# start system
sudo systemctl start nginx
sudo systemctl status nginx

###############################################
###### GoDaddy VPS Permissions
###############################################
sudo chmod -R 755 /home/melowisev/site
sudo chmod 711 /home/melowisev

conda create -n ladder python=3.14 -y

# navigate to the folder holding the requirements
conda activate ladder
pip install -r requirements.txt
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt pillow gunicorn psycopg[binary]  python-dotenv

# Navigate to where manage.py is located (backend folder)
## folder cd /home/melowisev/site/ladder/backend/ladder/
/home/melowisev/anaconda3/envs/ladder/bin/gunicorn ladder.wsgi:application --bind 0.0.0.0:8001

#run in background 
nohup /home/melowisev/anaconda3/envs/ladder/bin/gunicorn ladder.wsgi:application --bind 0.0.0.0:8000 > gunicorn.log 2>&1 &

########## ssl
# encrypt free
# install certbot 
# check if its installed 
certbot --version

# set domain up make sure it points to the right ip address
nslookup ladder.melowise.com

# make sur there is a server name. 
# default we put server_name _;
sudo nano /etc/nginx/conf.d/default.conf
# in the server block add
server_name ladder.melowise.com;

# reload nginx
sudo nginx -t && sudo systemctl reload nginx

# check nginx status
sudo systemctl status nginx

# verify your domain works
curl http://ladder.melowise.com

# run certbot to get the ssl
# on my VPS certbot is installed system wide. 
# run this command in your conda env 
which certbot
# this will bring you back the path to the command
sudo certbot --nginx -d ladder.melowise.com

# DNS propgation delay, this might take like 5 to 30min. 


###### git hub deploy
# you need a personal acces Token
#https://github.com/settings/tokens
# token classic
# ok to not have a expiration date.
# click repo only
# generate token

git config --global credential.helper store
git add .
git commit -m ""
git push
#-------------------------- this will pop up
Username for 'https://github.com': Melowise5
Password for 'https://Melowise5@github.com': ADD TOKEN HERE AS YOUR PASSWORD


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