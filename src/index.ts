export class Lilly {

    // Sets writing permissions.
    readonly: boolean = false;

    // Stores connection state.
    // Needed for `restore`, `undo`  and `fixate` methods.
    connected: boolean = false;

    // Saves the state of the storage upon connection.
    container: any[] = [];

    
    // Creates new instance of database with a name. 
    // Name becomes a prefix for database entries.
    constructor(public name: string = '', public access: string = '') {

        this.name.length ? this.name += '__' : this.name = "__";
        this.access === 'readonly' && (this.readonly = true);        

    }

    // Attempts to establish a connection to local storage.
    // If it is not available then returns error.
    // If connection is successfull then callback is executed.
    connect(callback: any) {

        try {            
            localStorage.setItem("null", "null");
            localStorage.removeItem("null");
        } catch (e) {
            return typeof callback === 'function' ? callback(e) : false;
        }

        // Sets state to 'connected' to use additional methods.
        this.connected = true;

        // Stores the state and restore point of the storage data.
        this.fixate();

        return typeof callback === 'function' ? callback(null, true) : true;
    }

    // Saves data into storage in JSON object format.
    // Silently logs to console if error occurs.
    save(key: string, data: any): boolean {

        if (this.readonly) return false;
        if (!key || !data) {
            console && console.log("Mising arguments. Save aborted");
            return false;
        }
        // Objectifying data to trap null and undefined data
        data = JSON.stringify({
            "_v": data
        });
        try {
            localStorage.setItem(this.name + key, data);
        } catch (e) {
            console && console.log(`Failed to save data.
            Storage is either full or out of reach.`);
            return false;
        }
        return true;
    }

    // Looks for a key in a storage and checks its integrity.
    // If values aren't valid (for example - saved manually or by another script)
    // then attempts to reconstuct data according to this library's format. 
    find(key: any, fallback: any = false) {

        let data: any;
        try {
            data = JSON.parse(localStorage.getItem(this.name + key));
        } catch (e) {
            // If parse fails then parse it manually        
            if (localStorage[key]) {
                data = {
                    _v: localStorage.getItem(key)
                }
            }
            // If no such data then fall back to default value
            else return fallback;
        }

        if (data === null) return fallback;
        // Doublecheck data integrity
        if (typeof data === 'object' && data._v !== 'undefined') {
            return data._v;
        }
        return fallback;
    }

    // Returns an array of keys, associated with this instance of storage.
    // Instanceing is based on the name argument of the Lilly class and thus
    // on the prfixes of the keys saved to the storage. 
    findKeys() {
        let localKeys: any[] = [];
        let prefix = this.name;
        try {
            Object.keys(localStorage)
                .map(v => {
                    if (v.substr(0, prefix.length) === prefix) {
                        localKeys.push(v.substr(prefix.length));
                    }
                });
        } catch (e) {
            console && console.log(e);
            return;
        }

        return localKeys;
    }

    // Returns an array of all the keys for the current local storage.
    findGlobalKeys(): any[] {

        return Object.keys(localStorage);
    }

    // This will silently terminate if no such data. No need to catch errors.
    remove(key: string): void {

        if (this.readonly) return;
        localStorage.removeItem(this.name + key);
    }
    
    // Pushing additional data to the key.
    // If key exists and not an array then it is converted and data is pushed.
    // If key does not exist then it is created and new data is push as an array.
    push(key: string, value: any): boolean {

        try{
            // Grab data from staorage if any.
            let data = this.find(key);
            // If no hey or no data then init an array.
            if (!data) data = [];
            if (Array.isArray(data)){
                data.push(value);
                this.save(key, data);
            }
            //If data exists but not an array the convert it and push.
            else{
                let _data: any[] = [];
                _data.push(data);
                _data.push(value);
                this.save(key, _data);            }
        }
        catch(e){
            console && console.log(`Failed to push data.
            Storage is either full or out of reach.`);
            return false;
        }

        return true;
    }
    pull() {}

    // Restores the state of the database
    restore() {
        if (!this.connected || !this.container) return false;
        for (let item of this.container) {
            this.save(item[0], item[1]);
        }
    }
    undo() {
        if (!this.connected) return false;
    }

    // Constructs a restore point for local storage data.
    // This method fires upon .connect() and also can be called manually.
    fixate() {

        if (!this.connected) return false;
        this.container = [];
        let keys: any[] = this.findKeys();
        for (let key of keys) {
            this.container.push([key, this.find(key)]);
        }       

    }

    // Destroys all local storage data associated with this particular database.
    // Keeps all other keys.
    drop(): boolean {

        if (this.readonly) return;
        let keys = this.findKeys();
        try{ 
            keys && keys.map(key => localStorage.removeItem(this.name + key));
        }
        catch(e){
            return false;
        }
        return true;
    }
}