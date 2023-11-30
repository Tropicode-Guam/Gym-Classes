* user sign up and be able to see upcoming classes
* plus an admin panel:
input new classes with a picture + description, maximum signups, date for signups.

## Prereqs

* Install [Docker](https://www.docker.com/get-started/)  
* Create a `.env` file
  * copy [.env.sample](.env.sample) and name it `.env`
  * fill in all the environment variables

## Deployment

`docker compose up -d --build`

## Development

`docker compose -f docker-compose.dev.yml up --build`