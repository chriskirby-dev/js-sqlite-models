import ModelBase from './Base.mjs';
import Contact from './Contact.mjs';
import Address from './Address.mjs';
import { default as ClassUtil } from '../util/class.mjs';
import { default as Util } from '../util/base.mjs';

class Person extends ModelBase {

    static table = 'people';
    static plural = 'People';
    static primaryKey = 'id';
    static foreignKey = 'person_id';

    static indexes = ['id', 'ssn'];

    static hasMany = {
        Contact:{ 
            order: 'current DESC', 
            on: {
                'person_id': 'Person.id'
            }
        }, 
        Address: { 
            order: 'current DESC',
            on: {
                'person_id': 'Person.id'
            }
        }
    };

    static get fields(){
        return {  
            'id': {
                type: 'INTEGER',
                ai: true,
                primary: true
            },
            'first_name': {
                type: 'VARCHAR',
                max: 65
            },
            'middle_name': {
                type: 'VARCHAR',
                max: 65
            },
            'last_name': {
                type: 'VARCHAR',
                max: 65
            },
            'dob': {
                type: 'DATE'
            },
            'ssn': {
                type: 'VARCHAR',
                max: 9,
                unique: true
            },
            'status': {
                type: 'bit',
                default: 1
            }
        };
    }

    name = "Person";

    constructor( data ){
        super( data );
        ClassUtil.copyStaticToInstance( Person, this );
        super.init();
    }

    

    static beforeSave( data ){

        if( data.dob && Util.Symbol.type( data.dob, 'string' ) ){
            data.dob = new Util.Date( data.dob ).format("Y-m-d");
        }

        if( data.ssn.indexOf('-') !== -1 )
        data.ssn = data.ssn.replace(/[-]/g, '')
        data.ssn = Util.String.padd( data.ssn, 9, "0" );

        return data;
    }

    static afterFind( data ){

        if( data.ssn.indexOf('-') !== -1 )
        data.ssn = data.ssn.replace(/[-]/g, '')
        data.ssn = Util.String.padd( data.ssn, 9, "0" );
        data.ssn = Util.String.splitLengths( data.ssn, 3, 2, 4 ).join('-');

        return data;
    }

    static save( ...args ){
        return super.save( ...args );
    }

    

    static deep( person ){
        person = person || this.data;
        if( person ){
            person.age = new Util.Date( person.dob ).ago();
            person.middle_initial = person.middle_name ? person.middle_name.charAt(0)+'.' : '_';
            person.Contact = Contact.getByPersonId( person.id );
            person.Contacts = Contact.getAllByPersonId( person.id );
            person.Address = Address.getByPersonId( person.id );
            person.Addresses = Address.getAllByPersonId( person.id );
            person.address_count = person.Addresses ? person.Addresses.length : 0;
            person.contact_count = person.Contacts ? person.Contacts.length : 0;
        }
        return person;
    }
    
    static getById( person_id ){
        return this.deepFind(['*'], { id: person_id });
    }




}

//Person.define();

class People {

    static all(){

        const Address =  global.ModelList.Address;
        const Contact =  global.ModelList.Contact;

        const people = Person.findAll();
        return people.map( (person) => {
            person.middle_initial = person.middle_name ? person.middle_name.charAt(0)+'.' : '_';
            person.Contact = Contact.getByPersonId( person.id );
            person.Contacts = Contact.getAllByPersonId( person.id );
            person.Address = Address.getByPersonId( person.id );
            person.Addresses = Address.getAllByPersonId( person.id );
            person.location_count = person.Addresses ? person.Addresses.length : 0;
            person.contact_count = person.Contacts ? person.Contacts.length : 0;
            return person;
        });
    }

    static import( raw ){
        var arr = new Util.Array( raw );

        while(arr.next()){
            Person.deepSave( arr.current() );
        }

        /*
        const person = new Person( Person.extract( arr.current() ) );
        if( !person.exists ){
            console.log( person.save() );
        }
        arr.current().person_id = person.id;

        console.log('People import', person );
        */
    }
}


export { Person, People };
