
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('hospital_erp', 'root', 'Midhu@123', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false // set to true if you want to see SQL logs
});

sequelize.authenticate()
  .then(() => {
    console.log('Connected to MySQL database via Sequelize!');
  })
  .catch((err) => {
    console.error('Sequelize connection error:', err);
  });

module.exports = sequelize;
