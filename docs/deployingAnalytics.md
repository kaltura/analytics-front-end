### Creating a new Analytics version

1. Update the new version number in the following places:
   1. package.json
   2. configuration/analytics-config.ts - appVersion value
   3. deploy/config.ini
   4. deploy_v7/config.ini
2. commit changes with the commit message ```chore: bump analytics version to vX.X.X```
3. run ```ng build --prod``` to create a new production version in the dist folder
4. create a folder (not in the Analytics project) with the version name ```vX.X.X``` and inside it another folder with the same name
5. copy the content of the ```dist/analytics-front-end``` folder into the inner folder. Verify hidden files are shown and copied, specifically the file ```.htaccess```
6. copy the folders ```deploy``` and ```deploy_v7``` into the inner folder
7. zip the outer folder using ```zip -r kmcAnalytics_vX.X.X.zip . -x "*.DS_Store" -x "__MACOSX"``` and rename the zip file according to the current version
8. tag the new version on Github and add the created zip file to the version assets

