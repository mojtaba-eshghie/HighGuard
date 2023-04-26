let prompt = require('prompt-sync')();
let fs = require('fs');
let connect = require('@databases/sqlite');
let {sql} = require('@databases/sqlite');
let sqlite3 = require('sqlite3');
let path = require('path');

let DB_PATH = path.join(__dirname, "..", "datastore", "auth.db");

let ask = () => {
    const username = prompt('DCRGraphs.net Username: ');
    const pass = prompt('DCRGraphs.net Pass: ', opts={echo:'*'});

    return {username, pass};
}

let create_db = () => {
    return new sqlite3.Database(DB_PATH, 
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
    (err) => { 
        //console.log(err);
    });   
}

let create_table = (db) => {
    db.exec(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username,
        pass
    );`, (r)  => {
        //console.log(r);
    });
}

let insert = (db, {username, pass}) => {
    query = `INSERT INTO users (username, pass) 
    VALUES('${username}', '${pass}');`;

    db.exec(query, (r)  => {
        //console.log(r);
    });
}

let get_user = async () => {
    let db = connect(DB_PATH);
    return await db.query(sql`SELECT * FROM users`).then((r) => {
        return r;
    })
}

let authenticate = async () => {
    if (fs.existsSync(DB_PATH)) {
        
        return get_user().then((res) => {
            return {
                username:res[0].username, 
                pass:res[0].pass
            };
        })
        
    } else {
        let db = create_db();
        create_table(db);
        let {username, pass} = ask();
        insert(db, {username, pass});
        return {
            username:username, 
            pass:pass
        };
    }
}

module.exports = authenticate;