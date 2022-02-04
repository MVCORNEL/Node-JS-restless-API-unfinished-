const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(user, url = '') {
    this.to = user.email;
    this.firstName = user.firstName;
    this.from = `Manea Valentin <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  //MAIL TRAP for development
  //SEND GRID for production
  newTransport() {
    if (process.env.NODE_ENV == 'production') {
      //SENDGRID
      return nodemailer.createTransport({
        //When we specify the service we don't need need to specify the HOST and PORT anylonger
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
        tls: { rejectUnauthorized: false },
      });
    } else {
      //MAIL TRAP
      return nodemailer.createTransport({
        //need to specify host and port because MAIL TRAP is not a default nodemailer service
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
          user: process.env.MAILTRAP_USERNAME,
          pass: process.env.MAILTRAP_PASSWORD,
        },
      });
    }
  }

  //GENERIC SEND MESSAGE -> SEND HTM TO THE USER
  async sendEmail(template, subject) {
    //1 Define email options
    const mailOptions = {
      //Where the email is coming from
      from: this.from,
      //Recipient address, the option object is the one passwd within the function
      to: this.to,
      text: subject,
      html: `<b>${subject}</b>`,
    };

    // 3) Create a transporter and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.sendEmail('empty', `${this.firstName}, Welcome to the ZIPPY Group!`);
  }

  async sendPasswordReset() {
    const message = `Forgot your Password? Submit a PATCH requset with your new password and passwordConfirm to: ${this.url} \n If you didn't forget your password, please ignore this email !`;
    await this.sendEmail('empty', message);
  }
};
