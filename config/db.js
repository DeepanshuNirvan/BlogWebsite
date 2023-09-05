const Sequelize = require("sequelize");
const sequelize = new Sequelize(
   'users',
   'root',
   '',
    {
      host: 'localhost',
      dialect: 'mysql'
    }
  );

sequelize.authenticate().then(() => {
   console.log('Connection has been established successfully.');
}).catch((error) => {
   console.error('Unable to connect to the database: ', error);
});

module.exports=sequelize;


// const mysql = require('mysql');

// const con = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database:"users",
// });

// con.connect((err)=>{
//   if (err) throw err;
//   console.log("Database Connected!");
// });
// module.exports=con;