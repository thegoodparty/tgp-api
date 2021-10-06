/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const mailchimp = require('@mailchimp/mailchimp_marketing');
const md5 = require('md5');
const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server =
  sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server,
});
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const listName =
        appBase === 'https://goodparty.org'
          ? 'The Good Party'
          : 'Good Party Dev';
      const { lists } = await mailchimp.lists.getAllLists();
      console.log('lists:', lists);
      const tgpList = lists.find(list => list.name === listName);

      let users = await User.find();
      let candidates = await Candidate.find();
      let candidateTags = {};
      candidates.forEach(candidate => {
        const { race } = JSON.parse(candidate.data);
        let { firstName, lastName, id } = candidate;
        const tag = `${firstName} ${lastName} for ${race} ### ${id}`;
        candidateTags[candidate.id] = tag;
        console.log('TAG: ', tag);
      });
      let offset = 0;
      let memberList = [];
      while (true) {
        console.log('while iteration', offset);
        let { members } = await mailchimp.lists.getListMembersInfo(tgpList.id, {
          count: 500,
          offset,
        });

        memberList = [...memberList, ...members];
        offset += 500;
        if (members.length === 0) {
          break;
        }
      }
      console.log('memberList.length', memberList.length);
      // const { members } = await mailchimp.lists.getListMembersInfo(tgpList.id, { count: 1000, offset: 0 });
      // console.log(members.map(member => member.id));
      // const response = await mailchimp.lists.addListMember(tgpList.id, {
      //   email_address: users[0].email,
      //   status: 'subscribed',
      //   merge_fields: {
      //     FNAME: users[0].name.split(' ')[0].trim(),
      //     LNAME: users[0].name.replace(users[0].name.split(' ')[0], '').trim(),
      //   },
      // });
      const candidateSupports = await Support.find();
      for (let i = 0; i < users.length; i++) {
        console.log(users[i].email, users[i].name);
        // const candidateSupports = await Support.find({
        //   candidate: users[i].id
        // });
        const supports = candidateSupports.filter(
          support => support.user === users[i].id,
        );
        const tags = supports
          .map(support => candidateTags[support.candidate])
          .filter(item => !!item);
        console.log('user tags', tags);
        const member = memberList.find(
          member => member.email_address === users[i].email,
        );
        if (member) {
          console.log('Found', member);
          // console.log(
          //   memberList.find(member => member.email_address === users[i].email),
          // );
          const fname = users[i].name.split(' ')[0].trim(),
            lname = users[i].name
              .replace(users[i].name.split(' ')[0], '')
              .trim();
          if (
            member.merge_fields.FNAME === fname &&
            member.merge_fields.LNAME === lname
          ) {
            console.log('continue', fname, lname);
            continue;
          } else {
            const subscriberHash = md5(users[i].email);
            await mailchimp.lists.updateListMember(tgpList.id, subscriberHash, {
              email_address: users[i].email,
              status: 'subscribed',
              merge_fields: {
                FNAME: users[i].name.split(' ')[0].trim(),
                LNAME: users[i].name
                  .replace(users[i].name.split(' ')[0], '')
                  .trim(),
                ADDRESS: 'None',
              },
              tags,
            });
            console.log('added ', users[i].email);
            continue;
          }
        }
        // try {
        //   const subscriberHash = md5(users[i].email);
        //   await mailchimp.lists.deleteListMemberPermanent(
        //     tgpList.id,
        //     subscriberHash,
        //   );
        // } catch (e) {
        //   console.log(e);
        // }
        try {
          console.log('before addListMember', users[i].email);
          await mailchimp.lists.addListMember(tgpList.id, {
            email_address: users[i].email,
            status: 'subscribed',
            merge_fields: {
              FNAME: users[i].name.split(' ')[0].trim(),
              LNAME: users[i].name
                .replace(users[i].name.split(' ')[0], '')
                .trim(),
            },
            tags,
          });
          console.log('after addListMember', users[i].email);
        } catch (e) {
          console.log('error addListMember', users[i].email);
          console.log(e);
        }
      }
      // console.log('Hello World')
      return exits.success(candidateTags);
    } catch (e) {
      console.log('Error in mailchimp seed', e);
      return exits.success({
        message: 'Error in mailchimp seed',
        error: JSON.stringify(e),
      });
    }
  },
};
