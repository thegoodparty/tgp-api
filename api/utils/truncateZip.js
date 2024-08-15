const truncateZip = zip => zip.length > 5 ? zip.substring(0, 5) : zip

module.exports = { truncateZip };
