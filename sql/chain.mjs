import SqlUtil from './util.mjs';

class SqlChain {

    defined = {};

    constructor( table, type ){
        this.defined = {};
        if( table ) this.defined.table = table;
        if( type ) this.defined.type = type;
    }

    table( table ){
        this.defined.table = table;
        return this;
    }

    type( type ){
        this.defined.type = type;
        return this;
    }

    data( data ){
        this.defined.data = data;
        const split = SqlUtil.splitData( data );
        this.defined.columns = split.columns;
        this.defined.values = split.values;
        return this;
    }

    columns( columns ){
        this.defined.columns = columns;
        return this;
    }

    join( table, type, conditions ){
        if(!this.defined.joins) this.defined.joins = [];
        this.defined.joins.push({ 
            table: table, 
            type: type || 'inner',
            conditions: conditions
        });
        return this;
    }

    where( conditions ){
        this.defined.where = SqlUtil.conditions( conditions );
        return this;
    }

    limit( count ){
        if(!this.defined.options) this.defined.options = {};
        this.defined.options.limit = count;
        return this;
    }

    group( by ){
        if(!this.defined.options) this.defined.options = {};
        this.defined.options.group = by;
        return this;
    }

    order( by ){
        if(!this.defined.options) this.defined.options = {};
        this.defined.options.order = by;
        return this;
    }

    compile(){

        const defined = this.defined;
        var args = [ defined.table ];

        if( defined.type !== 'delete' ) args.push( defined.columns );

        let sql = SqlUtil[defined.type]( ...args );

        if(defined.joins){
            for( var i=0;i<defined.joins.length;i++){
                sql += SqlUtil.join( defined.joins[i].table, defined.joins[i].type, defined.joins[i].conditions );
            }
        }

        if( defined.where ){
            sql += SqlUtil.where( defined.where );
        }
        console.log(sql);
        return [sql.trim(), defined.values ]
    }
}

export { SqlChain as default }