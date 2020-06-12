const DATA_TYPES = ["int","smallint","tintint", "money", "smallmoney", "real","float","datetime", "date", "time" ,"char", "varchar", "text", "image", "timestamp", "uniqueidentifier"];
const CONSTRAINED_TYPES = ["varchar","nvarchar","varbinary"];

class SqlColumn {

    constructor( name, options={} ){
        this.name = name;
        this.options = options;
    }
    
    createDefinition(){
        const options = this.options;
        let datatypes = [];
        datatypes.push( options.type + ( options.max ? '('+options.max+')' : '' ));
        
        if( options.primary ) datatypes.push("PRIMARY KEY");
        if( options.notNull ) datatypes.push("NOT NULL");
        if( options.unique ) datatypes.push("UNIQUE");
        if( options.ai || options.autoincrement ) datatypes.push("AUTOINCREMENT");
        if( options.default !== undefined ) datatypes.push('DEFAULT '+ options.default)
        return datatypes.join(" ");
    }
}

class SqlTable {
    constructor( name, sql ){
        this.sql = sql;
        this.name = name;
        this.columns = {};
        this.CONSTRAINTS = { };
    }

    addColumn( name, options ){
        this.columns[name] = new SqlColumn( name, options );
    }

    define(){
        const columns = [];
        for( let name in this.columns ){
            columns.push( name +" "+ this.columns[name].createDefinition() );
        }
        return columns.join(", \n ");
    }

    create(){
        return `CREATE TABLE IF NOT EXISTS ${ this.name } ( \n ${ this.define() } \n);`;
    }
}


export { SqlTable as default };