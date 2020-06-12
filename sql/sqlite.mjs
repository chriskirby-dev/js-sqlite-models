
import sqlite3 from 'sqlite3';
import SqlBase from './base.mjs';


class Sqlite3 extends SqlBase {

    static prepairDataType( data, type ){
        type = type.toLowerCase();
        if( type == 'date' || type == 'datetime' )
    }


    constructor( config ) {
        super( config );
    }

    connect( callback ){
        const self = this;
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database( self.config.db, sqlite3.OPEN_READWRITE, (err) => {
                if( err ){
                    return reject( err );
                }
                return resolve( db );
            });
            self.db = db;
            return false;
        });
    }

    exec( statement, values = [] ){
        const self = this;

    }

/*
    exec( sql, replacements = [] ){
        let self = this;
        return new Promise((resolve, reject) => {

            self.db.run( sql, replacements, function( err ){
                //Scope MySQL Statement
                if(err){
                    console.error('Error running sql ' + sql)
                      console.log(err)
                    return reject( err );
                }else{
                    return resolve( this );
                }
                return false;
            });

        })
    }
*/
}


export { Sqlite3 as default };