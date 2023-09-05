const sequelize=require('../config/db.js');
const Sequelize = require("sequelize");
const Admin = sequelize.define('admins',{
    id:{
        type:Sequelize.DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
        
    },
    name:{
        type:Sequelize.DataTypes.STRING
    },
    email:{
        type:Sequelize.DataTypes.STRING
    },
    password:{
        type:Sequelize.DataTypes.STRING
    }

},{
    timestamps: false,
});

sequelize.sync().then(() => {
    console.log('Admin table created successfully!');
 }).catch((error) => {
    console.error('Unable to create table : ', error);
 });

module.exports=Admin;