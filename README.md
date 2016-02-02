Env

##Convert Turnkey Site to Mito
Go to /site_admin/accounts/account/ (filter by turnkey)
Select the site
Check new context
Uncheck "in production" (if not already unchecked)
Select turnkey_2 from theme dropdown
Save
add to site url /etc/hosts
delete all nav items and reenter

## Dev Env
launch postgres
workon bentobox
~python manage.py migrate
python manage.py runserver
redis-server
~clone site into clients_sites/
	git clone git@git.getbento.com:<site-name>
~add site to etc/hosts
	127.0.0.1 <site-name>.bento.dev
http://<site-name>.bento.dev:8000/
~npm install
grunt watch

## Deploy
git add .
~git add -u
git commit -m '<message>'
git push
~Paste latest git commit hash into site_admin/themes/turnkey_2
Go to accounts/<site-name>
Check box and select "force theme update" from dropdown
