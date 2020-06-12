class SqlUtil {

    static dataToColumns( data ){
        return Object.keys( data ); 
    }

    static splitData( data ){
        const cols = [], vals = [];
        for( const col in data ){
            cols.push( col );
            vals.push( data[col] );
        }
        return { columns: cols, values: vals };
    }

    static on( conditions ){
        let on = [];
        for( var prop in conditions ){
            on.push(`${prop} = ${conditions[prop]} `);
        }
        return `ON ${ on.join(' AND ') } `;
    }

    static where( conditions ){
        return conditions ? `WHERE ${ Object.keys(conditions).map( (k) => `${ k } = ?`  ).join(' AND ') }` : '';
    }

    static options( options ){
        var opts = "";
        if( options ){
            if( options.group ) opts += ` GROUP BY ${options.group}`;
            if( options.order ) opts += ` ORDER BY ${options.order}`;
            if( options.limit ) opts += ` LIMIT ${options.limit}`;
        }
        return opts;
    }

    static insert( table, columns ){
        return `INSERT INTO ${ table } ( ${ columns.join(', ') } ) VALUES ( ${ columns.map( () => '?').join(', ') } )`;
    }

    static update( table, columns ){
        return `UPDATE ${table} SET ${ columns.map( (k) => `${ k } = ?` ).join(', ') } `;
    }

    static select( table, columns=["*"] ){
        return `SELECT  ${ columns.join(', ') } FROM ${ table } `;
    }

    static delete( table ){
        return `DELETE FROM ${table} `;
    }

    static join( table, type, conditions ){
        return `${type.toUpperCase()} JOIN ${ table } ${this.on(conditions)} `;
    }
}

export { SqlUtil as default }