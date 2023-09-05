const sequelize=require('../config/db.js');
const Sequelize = require("sequelize");
const Blog = sequelize.define('blogs',{
    bid:{
        type:Sequelize.DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
        
    },
    title:{
        type:Sequelize.DataTypes.STRING
    },
    des:{
        type:Sequelize.DataTypes.STRING
    },
    imgurl:{
        type:Sequelize.DataTypes.STRING
    },
    category:{
        type:Sequelize.DataTypes.STRING
    }

},{
    timestamps: false,
});

sequelize.sync().then(() => {
    console.log('Blogs table created successfully!');
 }).catch((error) => {
    console.error('Unable to create table : ', error);
 });

module.exports=Blog;