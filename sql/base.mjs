import SqlTable from './table.mjs';
import SqlChain from './chain.mjs';
import SqlUtil from './util.mjs';

class SqlBase {

    constructor( config ) {
        this.config = config;
        this.tables = {};
    }

    addTable( name ){
       console.log('Add Table', name );
       this.tables[name] = new SqlTable( name );
       return this.tables[name];
    }

    createTable( name ){
        console.log('Create Table', name, this.tables[name] );
        let sql = `CREATE TABLE IF NOT EXISTS ${name} ( \n ${ this.tables[name].define() } \n);`;
        return this.exec( sql );
    }

    conditions( conditions ){
        return conditions ? `WHERE ${ Object.keys(conditions).map( (k) => `${ k } = ?`  ).join(' AND ') }` : '';
    }

    options( options ){
        var opts = "";
        if( options ){
            if( options.group ) opts += ` GROUP BY ${options.group}`;
            if( options.order ) opts += ` ORDER BY ${options.order}`;
            if( options.limit ) opts += ` LIMIT ${options.limit}`;
        }
        return opts;
    }

    insert( table, data ){
        return this.run( ...this.op( 'INSERT', table, null, null, data  ) );
    }

    select( table, data, conditions, options = {} ){
        console.log(table, data, conditions, options);
        if(!data) data = ['*'];
        if( typeof data == 'string') data = [data];
        return this[options.limit && options.limit == 1 ? 'row' : 'all']( ...this.op( 'SELECT', table, conditions, options, data ));
    }

    update( table, data, conditions ){
        return this.run( ...this.op( 'UPDATE', table, conditions, null, data ) );
    }

    delete( table, conditions ){
        console.log('DELETE', table, conditions);
        return this.run( ...this.op( 'DELETE', table, conditions ) );
    }

    chain( table, type ){
        return new SqlChain( table, type );
    }

    op( action, table, conditions, options, data ){
        console.log( action, table, conditions, options, data );
        let resp = [];
        let stmt = "", cols = [], values = [];
        if( action != 'SELECT' && data ){
            cols = Object.keys( data );
            values = Object.values( data );
        }else if( action == 'SELECT' ){
            cols = ['*'];
        }

        if( conditions && Object.keys( conditions ).length > 0 ){
            values = values.concat( Object.values( conditions ) );
        }

        switch( action ){
            case 'INSERT':
                stmt += SqlUtil.insert( table, cols );
            break;
            case 'SELECT':
                cols = data;
                stmt += SqlUtil.select( table, cols );
                if( conditions ) stmt += SqlUtil.where( conditions );
            break;
            case 'UPDATE':
                stmt += SqlUtil.update( table, cols );
                if( conditions ) stmt += SqlUtil.where( conditions );
            break;
            case 'DELETE':
                stmt += SqlUtil.delete( table );
                if( conditions ) stmt += SqlUtil.where( conditions );
                if( conditions ){
                    values = Object.values( conditions );
                }
            break;
        }
        resp = [stmt];
        if( values.length > 0 ) resp.push( values );

        console.log(resp);
        return resp;
    }

    run( stmt, vals = [] ){
        console.log( 'STATEMENT --->', stmt );
        console.log( 'VALUES -- >', vals );
        return this.db.prepair( stmt ).run.apply( this.db, vals );
    }
    
}


export { SqlBase as default };