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
            const reqUser = this.req.user;
            const { message, creatorName, projectName, creatorEmail } = inputs;
            const subject = `❤️ ${reqUser.name} can help with ${projectName}`;
            const messageHeader = '';
            const messageBody = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                <tr>
                <td>
                    <h2 style="color: #484848; text-align: left; font-size: 33px;  letter-spacing: 1px; margin-top: 24px; margin-bottom: 24px;">
                        ${reqUser.name} sent you a message
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
                <tr>
                    <td>
                        <br/><br/><br/>
                        <a href="mailto:${reqUser.email}" style="padding: 16px 32px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none;">
                        Reply to ${reqUser.name}                      
                        </a>
                    </td>
                </tr>
            </table>`;
            const ccEmail = 'creators@thegoodparty.org';
            const fromEmail = 'NoReply@TheGoodParty.org <noreply@thegoodparty.org>';
            await sails.helpers.mailgunSender(
                creatorEmail,
                creatorName,
                subject,
                messageHeader,
                messageBody,
                fromEmail,
                ccEmail
            );
            return exits.success({
                message: 'Email Sent Successfully',
            });
        } catch (err) {
            console.log('creators email sent error');
            console.log(err);
            return exits.badRequest({
                message: 'Content fetch failed. Please load again.',
            });
        }
    },
};
