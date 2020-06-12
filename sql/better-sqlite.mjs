
import Database from 'better-sqlite3';
import SqlBase from './base.mjs';


class BetterSqlite3 extends SqlBase {

    
    constructor( config ) {
        super( config );
    }

    connect( callback ){
        const self = this;
        const db = new Database( self.config.db, { verbose: console.log } );
        console.log(db);
        self.sqlite = db;
    }

    run( statement, values = [] ){
        const self = this;
        console.log('RUN |--| ', statement, values );
        const stmt = self.sqlite.prepare( statement );
        return stmt.run( values ); //Returns Info Obj
        
        //stmt.pluck( values ); //Returns Value of First Column
        //stmt.iterate( values ); //Returns All Rows One by One
    }

    row( statement, values = [] ){
        const self = this;
        const stmt = self.sqlite.prepare( statement );
        return stmt.get( values ); //Returns Row
    }

    all( statement, values = [] ){
        const self = this;
        const stmt = self.sqlite.prepare( statement );
        return stmt.all( values ); //Returns Row
    }

}


export { BetterSqlite3 as default };