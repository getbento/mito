Env

##Launch Dev Environment
launch postgres

cd bentobox/
workon bentobox
python manage.py runserver
(if migrate error run python manage.py migrate)
open site to work on at http://<site-name>.bento.dev:8000/

cd bentobox/bentobox/apps/themes/files/turnkey_2/
grunt watch

##Convert Turnkey Site to Turnkey 2
Go to /site_admin/accounts/account/ (filter by turnkey)
Select the site
Check new context
Uncheck "in production" (if not already unchecked)
Select turnkey_2 from theme dropdown
Save
add to site url /etc/hosts
delete all nav items and reenter

##Create New Turnkey 2 Site
Go to /site_admin/accounts/account/
Add new account
Enter account info
Check "in production"
Check "New Context"
Set theme dropdown to turnkey_2
Save
Open site at http://<site-name>.getbento.com
Open admin at http://<site-name>.getbento.com/bentobox/
Add nav items under Pages/Nav in admin

### Scaffolding Recommendations
auto-generate nav items:
Base, Menus, Private Events, About, Press, Locations

## Push to Production
Paste latest git commit hash into site_admin/themes/turnkey_2 (optional)
Go to accounts/<site>
Check box and select "force theme update" from dropdown

## Dev Env
launch postgres
workon bentobox
python manage.py runserver
redis-server