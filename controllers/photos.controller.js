const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
    const validFileExtension = /(.*?)\.(jpg|jpeg|gif|png)$/;
    const validEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const invalidSigns = /[<>%\$]/;

    /* Form Validation */
    let isValid = true;
    if (!title && !author && !email && !file) isValid = false;
    else if (title.length >= 25 || author.length >= 50) isValid = false;
    else if (!invalidSigns.test(title) || !invalidSigns.test(author)) isValid = false;
    else if (!validEmail.test(email)) isValid = false;
    else if (!validFileExtension.test(fileName)) isValid = false;

    if (isValid) {
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const user = await Voter.findOne({ user: req.clientIp });
    if (user) {
      const voterToUpdate = await Voter.findOne({ $and: [{ user: req.clientIp, votes: req.params.id }] });

      if (!voterToUpdate) {
        await Voter.updateOne({ user: req.clientIp }, { $push: { votes: [req.params.id] } });
        const photoToUpdate = await Photo.findOne({ _id: req.params.id });
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        res.status(500).json(err);
      }

    } else {
      const newVoter = new Voter({ user: req.clientIp, votes: [req.params.id] });
      await newVoter.save();
      const photoToUpdate = await Photo.findOne({ _id: req.params.id });
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });

    }
  } catch (err) {
    res.status(500).json(err);
  }

};
