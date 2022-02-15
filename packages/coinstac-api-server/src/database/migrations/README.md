# Migration Tool
This tool was created to facilitate database management both in development and production environments. We're currently using the `node-migrate` library.

## Create a new migration script

### Create your migration file
To create a migration script just copy the `migration-script-template.js` file into the `scripts` folder. Then rename the file using the following pattern `${YYYY}-${MM}-${DD}-${migration-title}.js`. So if you're creating a migration for adding a name field to the user collection, for example, you'd name your file like `2022-02-01-add-name-to-user.js`. The migrations are run in the order they appear in the `scripts` folder, so it's important to keep the filenames pattern.

### Set the description field
In the description field you can explain the intention of the migration script.

### Implement the up function in your script
This function will apply the changes you intend to do to the database schema.

### Implement the down function in your script
This function serves to revert the changes to the database schema. This may be used if someone wants to downgrade the version of the application.

## Migrate your database
To migrate your database you can simply run the following command in the `coinstac-api-server` root folder.

```
npm run migrate-db
```

The migration operation can be run any number of times you'd want. We control the state of the migration with a field in the database, so that means it's safe to run the migration script more than once.

## Migration state
We keep the migration state (which migration files were run), in a collection called `migrations` in the db. If you never ran a migration, the `migrations` collection will be created once you run the migrate command.