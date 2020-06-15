/**
 * creator/ich-email.js
 *
 * @description :: Sends and email to stakeholders when user submits a form.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
    friendlyName: 'I CAN HELP Email',

    description: 'Send email when a user submits a form for project on I CAN HELP Modal',

    inputs: {
        message: {
            friendlyName: 'Message',
            description: 'Message from user',
            type: 'string',
            required: true,
        },
        senderName: {
            friendlyName: 'SenderName',
            description: 'name of sender',
            type: 'string',
            required: true,
        },
        senderEmail: {
            friendlyName: 'SenderEmail',
            description: 'email of sender',
            type: 'string',
            required: true,
        },
        creatorName: {
            friendlyName: 'creatorName',
            description: 'name of project creator',
            type: 'string',
            required: true,
        },
        creatorEmail: {
            friendlyName: 'creatorEmail',
            description: 'email of project creator',
            type: 'string',
            required: true,
        },
        projectName: {
            friendlyName: 'Project Name',
            description: 'name of project',
            type: 'string',
            required: true,
        },
        userId: {
            friendlyName: 'userId',
            description: 'id of user',
            type: 'string',
        }
    },

    exits: {
        success: {
            description: 'Email Sent',
            responseType: 'ok',
        },
        badRequest: {
            description: 'Error sending email',
            responseType: 'badRequest',
        },
    },

    fn: async function (inputs, exits) {
        try {
            const { message, senderEmail, creatorName, creatorEmail, senderName, projectName, userId } = inputs;
            const subject = `❤️ ${senderName} can help with ${projectName}`;
            const messageHeader = '';
            const email = creatorEmail;

            const name = creatorName;
            const messageBody = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                <tr>
                <td>
                    <h2 style="color: #484848; text-align: left; font-size: 33px;  letter-spacing: 1px; margin-top: 24px; margin-bottom: 24px;">
                        ${senderName} sent you a message
                    </h2>
                </td>
                </tr>
                <tr>
                <td>
                    <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                        ${message}
                    </p>
                    </td>
                </tr>
            </table>`;
            const ccEmail = 'creators@thegoodparty.org';
            const toEmail = `${senderName} <${senderEmail}>`;
            await sails.helpers.mailgunSender(
                email,
                name,
                subject,
                messageHeader,
                messageBody,
                toEmail,
                ccEmail
            );
            return exits.success({
                message: 'Email Sent Successfully',
            });
        } catch (err) {
            console.log('email sent error');
            console.log(err);
            return exits.badRequest({
                message: 'Content fetch failed. Please load again.',
            });
        }
    },
};
