//marten made this for testing purposes
app.get('/api/users', (req, res) => {
    //const tasks = await db.collection('tasks').find().toArray();
    db.collection("users").find().toArray()
        .then(result => {res.json(result);})
        .catch( error => {console.log(error);});
});