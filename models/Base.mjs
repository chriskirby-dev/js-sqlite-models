import { default as Obj } from '../util/object.mjs';
import { default as Arr } from '../util/array.mjs';
import { default as Sym } from '../util/symbol.mjs';
import { default as ClassUtil } from '../util/class.mjs';
import { default as Util } from '../util/base.mjs';
import BetterSqlite3 from '../sql/better-sqlite.mjs';

const db = new BetterSqlite3({ db: './dark.db' } );
let connected = false;

db.connect();
const initializedModels = [];


class ModelBase {

    //STATIC PROPERTIES
    static primaryKey = 'id';
    static foreignKey = null;
    static fields = {};
    static indexes = [];
    static hasOne = null;
    static hasMany = null;
    static table = null;

    name = "ModelBase";
    
    initialized = false;
    beforeSave = null;
    afterSave = null;
    afterFindAll = null;
    afterFind = null;
    exists = false;


    

    constructor( data ){

        //ClassUtil.copyStaticProperties( this, ModelBase );
        ClassUtil.copyStaticToInstance( ModelBase, this );
        
        this.tmp = {}; 
        this.preSave = {};
        
        if(data) this.tmp.data = data;

    };

    static get SubClass(){
        return global.Models && global.Models.use( this.name );
    }

    static get columns(){
        console.log(  this );
        console.log(  this.name );
        return Object.keys( this.SubClass.fields );
    }

    static prefixedColumns(){
        return Object.keys( this.SubClass.fields ).map( ( field ) => `${this.name}.${field} AS ${this.name}_${field}` );
    }


    //Runs after new instance is created.
    init(){

        console.log('Init', this.name, this );
        //this.fields = this.constructor.fields;

        if( initializedModels.indexOf( this.table ) === -1 ){
            //Init Table
            const table = db.addTable( this.table );
            const fields = this.constructor.fields;
            if( !fields ) return console.error('Fields Undefined');

            console.log( fields );
            for( let colName in fields ){
                let options = fields[colName];
                if( options.preSave ) this.preSave[ colName ] = options.preSave;
                table.addColumn( colName, options );
            }
            db.run( table.create() );
            initializedModels.push(this.table);
        }

        if( this.tmp.data ){
            if( !Sym.type( this.tmp.data, 'object' ) ){
                let data = {};
                data[this.primaryKey] = this.tmp.data;
                this.tmp.data = data;
            }

            if(this.tmp.data[this.primaryKey]){
                var cond = {};
                cond[this.primaryKey] = this.tmp.data[this.primaryKey];
                console.log(cond);
                this.data = this.find( cond );
            }else{
                this.data = this.tmp.data;
            }
            delete this.tmp.data;


            if(this.data[this.primaryKey]) this.exists = true;

        }

        this.initialized = true;

    }

    static db(){
        return db;
    }

    static extract( data ){
        return Obj.extract( data, Object.keys( this.fields ) );
    }


    static delete( target ){
        let cond = {};
        if( Sym.type( target, 'object') ){
            cond = target;
        }else{
            cond[this.primaryKey] = target;
        }
        db.delete( this.table, cond );
    }

    static find( columns, conditions, options={} ){
        //SELECT LIMIT 1
        options.limit = 1;
        let data = db.select( this.table, columns, conditions, options );
        if( this.afterFind ) data = this.afterFind(data);
        return data;
    }

    static deepFind( columns, conditions, options ){
        let record = this.find( columns, conditions, options );
        if( this.deep ){
        return this.deep( record );
        }
        return record;
    }

    static deepFindAll( columns, conditions, options ){
        let records = this.findAll( columns, conditions, options );
        console.log(records);
        if( this.deep ){
            records = records.map( item => this.deep( item ) );
        }
        return records;
    }

    static findAll( columns, conditions, options ){
        let data = db.select( this.table, columns, conditions, options );
        if( data ){
            if( this.afterFindAll ){
                if( Sym.type( data, 'object') ) data = [data];
                data = this._afterFind(data);
                data = this.afterFindAll( data );
            }else
            if( this.afterFind ){

                data = data.map( this.afterFind );
            }
        }

        return data;
    }

    static _afterFind( data ){
        for( let fieldName in this.fields ){
            let field = this.fields[fieldName];
            if( field.type == 'DATETIME' || field.type == 'DATE' ){

            }

        }
        return data;
    }

    static _beforeSave( data, create ){

        for( let fieldName in this.fields ){

            let field = this.fields[fieldName];
            if( create && field.default && !data[fieldName] ){
                let defaultVal = field.default;
                if( field.type == 'DATETIME' || field.type == 'DATE' ){
                    let time = Date.now();
                    defaultVal = new Util.Date(time).format("Y-m-d H:i:s");
                }
                data[fieldName] = defaultVal;
            }

        }

        return data;
    }

    static save( data, conditions={}, callback ){
        let saveType = 'insert';
        if( data[this.primaryKey] ){
            saveType = 'update';
            conditions[this.primaryKey] = data[this.primaryKey];
            delete data[this.primaryKey];
        }

        data = this._beforeSave( data, saveType == 'insert' );
        console.log( data );
        var extracted = this.extract( data || this.data );

        if(this.beforeSave) extracted = this.beforeSave( extracted,  saveType == 'insert' );
        
        if( saveType == 'update' ){
            //UPDATE
            return db.update( this.table, extracted, conditions );
        }else{
            //INSERT
            const resp = db.insert( this.table, extracted );
            const insertId = resp.lastInsertRowid;
            extracted.id = insertId;
            this.data = extracted;
            return extracted;
        }
    }

    static saveAll( dataList ){
        const self = this;
        function saveNext(){
            self.save( dataList.shift() )
            if( dataList.length > 0 ) saveNext();
        }
        saveNext();
    }

    static deepSave( data ){

        var hasMany = {}, hasOne = {};
        const ModelList =  global.ModelList;
        const SubClass = ModelList.get( this.name );
        console.log( this );
        console.log( SubClass.hasMany );

        if( this.hasMany ){
            for( var modelName in this.hasMany ){
                if( data[modelName] && data[modelName].length > 0 ){
                    hasMany[modelName] = data[modelName];
                    delete data[modelName];
                }
            }
        }

        if( this.hasOne ){
             for( var modelName in this.hasOne ){
                if( data[modelName] ){
                    hasOne[modelName] = data[modelName];
                    delete data[modelName];
                }
            }
        }

        let mainSave = this.save( data );
        let insertId = mainSave.id;

        console.log('insertId', insertId);
        console.log(hasMany);

        if( !Sym.empty( hasMany ) ){
            for( let name in hasMany ){
                const Model = ModelList.get( name );
                const modelSaveData = hasMany[name];
                const mergeData = {}; 
                mergeData[Model.foreignKey] = insertId;
                Arr.mergeIntoAll( modelSaveData, mergeData );
                console.log(modelSaveData);
                Model.saveAll( modelSaveData );
            }
        }

    }

    static findByKey( primaryKey ){
        let conditions = {};
        conditions[this.primaryKey] = primaryKey;
        return this.find( ['*'], conditions )
    }

    static each( fn ){
        const records = this.findAll();
        function next(){
            record = records.shift();
            if( records.length == 0 ) next = null;
            fn( record, next );
        }
        next();
    }

    static tree( flatten ){

        let tree = this.columns;

        if( this.hasOne ){
            for( let modelName in this.hasOne ){
                const Model = global.Models.use( modelName );
                tree[modelName] = Model.tree();
            }
        } 

        if( this.hasMany ){
            for( let modelName in this.hasMany ){
                const Model = global.Models.use( modelName );
                tree[modelName] = [ Model.tree() ];
            }
        } 

        return flatten ? Util.Object.flatten( tree ) : tree;

    }

}

export { ModelBase as default };