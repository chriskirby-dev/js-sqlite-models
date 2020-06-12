import EventEmitter from '../events/emitter.mjs';
import BetterSqlite3 from '../sql/better-sqlite.mjs';
import Util from '../util/base.mjs';

const MODEL_DATA = {
    dir: import.meta.url.substr( 0, import.meta.url.lastIndexOf('/') ),
    registry: [],
    classes: []
};

/*
Models.config({ 
    db: 'dark',
    dir: '../dirpath'
});
*/

class Models extends EventEmitter{

    static info(){
        return MODEL_DATA;
    }

    static config( params ){

        if( params.dir ){
            if( params.dir.indexOf('./') === 0 ) params.dir = __dir + params.dir;
            MODEL_DATA.dir = params.dir;
        }

        if( params.db ){
            this.setDB( params.db );
        }

    }

    static setDB( dbname ){
        MODEL_DATA.dbname = dbname.indexOf('.db') !== -1 ? dbname : dbname+'.db';
        MODEL_DATA.db = new BetterSqlite3({ db: './'+MODEL_DATA.dbname } );
    }

    static async load( ModelClass ){
        const path = [ MODEL_DATA.dir, ModelClass ].join('/') + '.mjs';
        const Model = await import( path );
        MODEL_DATA.registry.push( Model.name );
        MODEL_DATA.classes.push( Model );
        new Model();
    }

    static register( ModelClass ){
        console.log('REGISTER ModelClass', ModelClass );
        if( Util.Symbol.type( ModelClass, 'string' ) ){
            return this.load( ModelClass );
        }
        MODEL_DATA.registry.push( ModelClass.name );
        MODEL_DATA.classes.push( ModelClass );
        new ModelClass();
    }

    static include( ...classes ){
        while( classes.length > 0 ){
            this.register( classes.shift() );
        }
    }

    static use( modelName ){
        const i = MODEL_DATA.registry.indexOf( modelName );
        return MODEL_DATA.classes[i];
    }

    static newInstance( modelName, options ){
        const Model = this.use( modelName );
        const inst = new Model( options );
        return inst;
    }
}


export { Models as default };