// /*
//  * Connect all of your endpoints together here.
//  */
// module.exports = function (app, router) {
//     app.use('/api', require('./home.js')(router));

//     var models = require('../models/user');
//     var User = models.User;
//     var Task = models.Task;

//     function parseQueryParam(param) {
//         if (!param) return undefined;
//         try {
//             return JSON.parse(param);
//         } catch (e) {
//             return { __parseError: true };
//         }
//     }

//     function applyQueryOptions(q, reqQuery, defaults) {
//         var where = parseQueryParam(reqQuery.where);
//         if (where && where.__parseError) return { error: 'Invalid JSON in where parameter' };
//         var sort = parseQueryParam(reqQuery.sort);
//         if (sort && sort.__parseError) return { error: 'Invalid JSON in sort parameter' };
//         var select = parseQueryParam(reqQuery.select);
//         if (select && select.__parseError) return { error: 'Invalid JSON in select parameter' };

//         var skip = reqQuery.skip ? parseInt(reqQuery.skip) : undefined;
//         var limit = reqQuery.limit ? parseInt(reqQuery.limit) : undefined;
//         if (isNaN(skip)) skip = undefined;
//         if (isNaN(limit)) limit = undefined;

//         var count = reqQuery.count === 'true' || reqQuery.count === true;

//         if (where) q = q.find(where);
//         if (sort) q = q.sort(sort);
//         if (typeof select !== 'undefined') q = q.select(select);
//         if (typeof skip !== 'undefined') q = q.skip(skip);
//         if (typeof limit !== 'undefined') {
//             q = q.limit(limit);
//         } else if (typeof defaults.limit !== 'undefined') {
//             q = q.limit(defaults.limit);
//         }
//         return { query: q, count: count };
//     }

//     router.get('/users', async function (req, res) {
//         try {
//             var base = User.find();
//             var applied = applyQueryOptions(base, req.query, { limit: undefined });
//             if (applied.error) return res.status(400).json({ message: applied.error, data: {} });

//             if (applied.count) {
//                 const docs = await applied.query.exec();
//                 return res.status(200).json({ message: 'OK', data: docs.length });
//             } else {
//                 const users = await applied.query.exec();
//                 return res.status(200).json({ message: 'OK', data: users });
//             }
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });


//     router.post('/users', async function (req, res) {
//         var body = req.body || {};
//         if (!body.name || !body.email) return res.status(400).json({ message: 'User must have name and email', data: {} });
//         try {
//             var existing = await User.findOne({ email: body.email }).exec();
//             if (existing) return res.status(400).json({ message: 'User with this email already exists', data: {} });

//             var user = new User({
//                 name: body.name,
//                 email: body.email,
//                 pendingTasks: Array.isArray(body.pendingTasks) ? body.pendingTasks : []
//             });
//             var saved = await user.save();

//             // ensure tasks reference back to this user
//             if (saved.pendingTasks && saved.pendingTasks.length) {
//                 await Task.updateMany({ _id: { $in: saved.pendingTasks } }, { assignedUser: saved._id.toString(), assignedUserName: saved.name }).exec();
//             }

//             return res.status(201).json({ message: 'User created', data: saved });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // GET /api/users/:id
//     router.get('/users/:id', async function (req, res) {
//         try {
//             var select = parseQueryParam(req.query.select);
//             if (select && select.__parseError) return res.status(400).json({ message: 'Invalid JSON in select parameter', data: {} });
//             var q = User.findById(req.params.id);
//             if (typeof select !== 'undefined') q = q.select(select);
//             var user = await q.exec();
//             if (!user) return res.status(404).json({ message: 'User not found', data: {} });
//             return res.status(200).json({ message: 'OK', data: user });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // PUT /api/users/:id
//     router.put('/users/:id', async function (req, res) {
//         var body = req.body || {};
//         if (!body.name || !body.email) return res.status(400).json({ message: 'User must have name and email', data: {} });
//         try {
//             var user = await User.findById(req.params.id).exec();
//             if (!user) return res.status(404).json({ message: 'User not found', data: {} });

//             var other = await User.findOne({ email: body.email, _id: { $ne: user._id } }).exec();
//             if (other) return res.status(400).json({ message: 'Another user with this email exists', data: {} });

//             var newPending = Array.isArray(body.pendingTasks) ? body.pendingTasks : [];
//             var oldPending = user.pendingTasks || [];

//             // Assign new tasks to this user
//             if (newPending.length) await Task.updateMany({ _id: { $in: newPending } }, { assignedUser: user._id.toString(), assignedUserName: body.name }).exec();
//             // Unassign tasks removed
//             var toUnassign = oldPending.filter(function (t) { return newPending.indexOf(t) === -1; });
//             if (toUnassign.length) await Task.updateMany({ _id: { $in: toUnassign } }, { assignedUser: "", assignedUserName: "unassigned" }).exec();

//             user.name = body.name;
//             user.email = body.email;
//             user.pendingTasks = newPending;
//             var saved = await user.save();
//             if (saved.assignedUser && (!saved.assignedUserName || saved.assignedUserName === "")) {
//                 const u = await User.findById(saved.assignedUser).exec();
//                 if (u) {
//                     saved.assignedUserName = u.name;
//                     await saved.save();
//                 }
//             }
//             return res.status(200).json({ message: 'User updated', data: saved });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // DELETE /api/users/:id
//     router.delete('/users/:id', async function (req, res) {
//         try {
//             var user = await User.findById(req.params.id).exec();
//             if (!user) return res.status(404).json({ message: 'User not found', data: {} });

//             if (user.pendingTasks && user.pendingTasks.length) {
//                 await Task.updateMany({ _id: { $in: user.pendingTasks } }, { assignedUser: "", assignedUserName: "unassigned" }).exec();
//             }

//             await User.deleteOne({ _id: user._id }).exec();
//             return res.status(200).json({ message: 'User deleted', data: {} });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // GET /api/tasks
//     router.get('/tasks', async function (req, res) {
//         try {
//             var base = Task.find();
//             // default limit for tasks is 100
//             var applied = applyQueryOptions(base, req.query, { limit: 100 });
//             if (applied.error) return res.status(400).json({ message: applied.error, data: {} });
//             if (applied.count) {
//                 const docs = await applied.query.exec();
//                 return res.status(200).json({ message: 'OK', data: docs.length });
//             } else {
//                 const tasks = await applied.query.exec();
//                 return res.status(200).json({ message: 'OK', data: tasks });
//             }
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // POST /api/tasks
//     router.post('/tasks', async function (req, res) {
//         var body = req.body || {};
//         if (!body.name || !body.deadline) return res.status(400).json({ message: 'Task must have name and deadline', data: {} });
//         try {
//             var task = new Task({
//                 name: body.name,
//                 description: body.description || "",
//                 deadline: body.deadline,
//                 completed: body.completed === true,
//                 assignedUser: body.assignedUser || "",
//                 assignedUserName: body.assignedUserName || (body.assignedUser ? "" : "unassigned")
//             });
//             var saved = await task.save();

//             // If assigned to a user, ensure user's pendingTasks include it
//             if (saved.assignedUser) {
//                 await User.updateOne({ _id: saved.assignedUser }, { $addToSet: { pendingTasks: saved._id.toString() } }).exec();
//                 // If user name missing, try to set it
//                 if (!saved.assignedUserName || saved.assignedUserName === "") {
//                     var u = await User.findById(saved.assignedUser).exec();
//                     if (u) {
//                         saved.assignedUserName = u.name;
//                         await saved.save();
//                     }
//                 }
//             }

//             return res.status(201).json({ message: 'Task created', data: saved });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // GET /api/tasks/:id
//     router.get('/tasks/:id', async function (req, res) {
//         try {
//             var select = parseQueryParam(req.query.select);
//             if (select && select.__parseError) return res.status(400).json({ message: 'Invalid JSON in select parameter', data: {} });
//             var q = Task.findById(req.params.id);
//             if (typeof select !== 'undefined') q = q.select(select);
//             var task = await q.exec();
//             if (!task) return res.status(404).json({ message: 'Task not found', data: {} });
//             return res.status(200).json({ message: 'OK', data: task });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // PUT /api/tasks/:id
//     router.put('/tasks/:id', async function (req, res) {
//         var body = req.body || {};
//         if (!body.name || !body.deadline) return res.status(400).json({ message: 'Task must have name and deadline', data: {} });
//         try {
//             var task = await Task.findById(req.params.id).exec();
//             if (!task) return res.status(404).json({ message: 'Task not found', data: {} });

//             var oldAssigned = task.assignedUser || "";

//             task.name = body.name;
//             task.description = body.description || "";
//             task.deadline = body.deadline;
//             task.completed = body.completed === true;
//             task.assignedUser = body.assignedUser || "";
//             task.assignedUserName = body.assignedUserName || (body.assignedUser ? "" : "unassigned");

//             var saved = await task.save();

//             // If assignment changed, update users' pendingTasks
//             if (oldAssigned && oldAssigned !== saved.assignedUser) {
//                 await User.updateOne({ _id: oldAssigned }, { $pull: { pendingTasks: saved._id.toString() } }).exec();
//             }
//             if (saved.assignedUser && (!oldAssigned || oldAssigned !== saved.assignedUser)) {
//                 await User.updateOne({ _id: saved.assignedUser }, { $addToSet: { pendingTasks: saved._id.toString() } }).exec();
//             }

//             return res.status(200).json({ message: 'Task updated', data: saved });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // DELETE /api/tasks/:id
//     router.delete('/tasks/:id', async function (req, res) {
//         try {
//             var task = await Task.findById(req.params.id).exec();
//             if (!task) return res.status(404).json({ message: 'Task not found', data: {} });

//             if (task.assignedUser) {
//                 await User.updateOne({ _id: task.assignedUser }, { $pull: { pendingTasks: task._id.toString() } }).exec();
//             }

//             await Task.deleteOne({ _id: task._id }).exec();
//             return res.status(200).json({ message: 'Task deleted', data: {} });
//         } catch (err) {
//             return res.status(500).json({ message: 'Server error', data: {} });
//         }
//     });

//     // Mount router at /api
//     app.use('/api', router);
// };

/*
 * Connect all of your endpoints together here.
 */

module.exports = function (app, router) {
    app.use('/api', require('./home.js')(router));

    const models = require('../models/user');
    const User = models.User;
    const Task = models.Task;

    // Helper: safely parse query parameters
    function parseQueryParam(param) {
        if (!param) return undefined;
        try {
            return JSON.parse(param);
        } catch (e) {
            return { __parseError: true };
        }
    }

    // Helper: apply where/sort/select/skip/limit/count
    function applyQueryOptions(q, reqQuery, defaults) {
        const where = parseQueryParam(reqQuery.where);
        if (where && where.__parseError) return { error: 'Invalid JSON in where parameter' };
        const sort = parseQueryParam(reqQuery.sort);
        if (sort && sort.__parseError) return { error: 'Invalid JSON in sort parameter' };
        const select = parseQueryParam(reqQuery.select);
        if (select && select.__parseError) return { error: 'Invalid JSON in select parameter' };

        let skip = reqQuery.skip ? parseInt(reqQuery.skip) : undefined;
        let limit = reqQuery.limit ? parseInt(reqQuery.limit) : defaults.limit;
        if (isNaN(skip)) skip = undefined;
        if (isNaN(limit)) limit = defaults.limit;

        const count = reqQuery.count === 'true' || reqQuery.count === true;

        if (where) q = q.find(where);
        if (sort) q = q.sort(sort);
        if (typeof select !== 'undefined') q = q.select(select);
        if (typeof skip !== 'undefined') q = q.skip(skip);
        if (typeof limit !== 'undefined') q = q.limit(limit);

        return { query: q, count, where };
    }

    // ---------------- USERS ---------------- //

    // GET /api/users
    router.get('/users', async (req, res) => {
        try {
            const base = User.find();
            const applied = applyQueryOptions(base, req.query, { limit: undefined });
            if (applied.error) return res.status(400).json({ message: applied.error, data: {} });

            if (applied.count) {
                const n = await User.countDocuments(applied.where || {}).exec();
                return res.status(200).json({ message: 'OK', data: n });
            } else {
                const users = await applied.query.exec();
                return res.status(200).json({ message: 'OK', data: users });
            }
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // POST /api/users
    router.post('/users', async (req, res) => {
        const body = req.body || {};
        if (!body.name || !body.email)
            return res.status(400).json({ message: 'User must have name and email', data: {} });

        try {
            const existing = await User.findOne({ email: body.email }).exec();
            if (existing)
                return res.status(400).json({ message: 'User with this email already exists', data: {} });

            const user = new User({
                name: body.name,
                email: body.email,
                pendingTasks: Array.isArray(body.pendingTasks) ? body.pendingTasks : []
            });
            const saved = await user.save();

            if (saved.pendingTasks.length) {
                await Task.updateMany(
                    { _id: { $in: saved.pendingTasks } },
                    { assignedUser: saved._id.toString(), assignedUserName: saved.name }
                ).exec();
            }

            return res.status(201).json({ message: 'User created', data: saved });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // GET /api/users/:id
    router.get('/users/:id', async (req, res) => {
        try {
            const select = parseQueryParam(req.query.select);
            if (select && select.__parseError)
                return res.status(400).json({ message: 'Invalid JSON in select parameter', data: {} });

            let q = User.findById(req.params.id);
            if (typeof select !== 'undefined') q = q.select(select);

            const user = await q.exec();
            if (!user) return res.status(404).json({ message: 'User not found', data: {} });
            return res.status(200).json({ message: 'OK', data: user });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // PUT /api/users/:id
    router.put('/users/:id', async (req, res) => {
        const body = req.body || {};
        if (!body.name || !body.email)
            return res.status(400).json({ message: 'User must have name and email', data: {} });

        try {
            const user = await User.findById(req.params.id).exec();
            if (!user) return res.status(404).json({ message: 'User not found', data: {} });

            const other = await User.findOne({ email: body.email, _id: { $ne: user._id } }).exec();
            if (other)
                return res.status(400).json({ message: 'Another user with this email exists', data: {} });

            const newPending = Array.isArray(body.pendingTasks) ? body.pendingTasks : [];
            const oldPending = user.pendingTasks || [];

            if (newPending.length)
                await Task.updateMany(
                    { _id: { $in: newPending } },
                    { assignedUser: user._id.toString(), assignedUserName: body.name }
                ).exec();

            const toUnassign = oldPending.filter(t => !newPending.includes(t));
            if (toUnassign.length)
                await Task.updateMany(
                    { _id: { $in: toUnassign } },
                    { assignedUser: '', assignedUserName: 'unassigned' }
                ).exec();

            user.name = body.name;
            user.email = body.email;
            user.pendingTasks = newPending;
            const saved = await user.save();

            return res.status(200).json({ message: 'User updated', data: saved });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // DELETE /api/users/:id
    router.delete('/users/:id', async (req, res) => {
        try {
            const user = await User.findById(req.params.id).exec();
            if (!user) return res.status(404).json({ message: 'User not found', data: {} });

            if (user.pendingTasks.length) {
                await Task.updateMany(
                    { _id: { $in: user.pendingTasks } },
                    { assignedUser: '', assignedUserName: 'unassigned' }
                ).exec();
            }

            await User.deleteOne({ _id: user._id }).exec();
            return res.status(200).json({ message: 'User deleted', data: {} });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // ---------------- TASKS ---------------- //

    // GET /api/tasks
    router.get('/tasks', async (req, res) => {
        try {
            const base = Task.find();
            const applied = applyQueryOptions(base, req.query, { limit: 100 });
            if (applied.error) return res.status(400).json({ message: applied.error, data: {} });

            if (applied.count) {
                const n = await Task.countDocuments(applied.where || {}).exec();
                return res.status(200).json({ message: 'OK', data: n });
            } else {
                const tasks = await applied.query.exec();
                return res.status(200).json({ message: 'OK', data: tasks });
            }
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // POST /api/tasks
    router.post('/tasks', async (req, res) => {
        const body = req.body || {};
        if (!body.name || !body.deadline)
            return res.status(400).json({ message: 'Task must have name and deadline', data: {} });

        try {
            const task = new Task({
                name: body.name,
                description: body.description || '',
                deadline: body.deadline,
                completed: body.completed === true,
                assignedUser: body.assignedUser || '',
                assignedUserName:
                    body.assignedUserName || (body.assignedUser ? '' : 'unassigned')
            });
            const saved = await task.save();

            if (saved.assignedUser) {
                await User.updateOne(
                    { _id: saved.assignedUser },
                    { $addToSet: { pendingTasks: saved._id.toString() } }
                ).exec();

                if (!saved.assignedUserName || saved.assignedUserName === '') {
                    const u = await User.findById(saved.assignedUser).exec();
                    if (u) {
                        saved.assignedUserName = u.name;
                        await saved.save();
                    }
                }
            }

            return res.status(201).json({ message: 'Task created', data: saved });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // GET /api/tasks/:id
    router.get('/tasks/:id', async (req, res) => {
        try {
            const select = parseQueryParam(req.query.select);
            if (select && select.__parseError)
                return res.status(400).json({ message: 'Invalid JSON in select parameter', data: {} });

            let q = Task.findById(req.params.id);
            if (typeof select !== 'undefined') q = q.select(select);

            const task = await q.exec();
            if (!task) return res.status(404).json({ message: 'Task not found', data: {} });
            return res.status(200).json({ message: 'OK', data: task });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // PUT /api/tasks/:id
    router.put('/tasks/:id', async (req, res) => {
        const body = req.body || {};
        if (!body.name || !body.deadline)
            return res.status(400).json({ message: 'Task must have name and deadline', data: {} });

        try {
            const task = await Task.findById(req.params.id).exec();
            if (!task) return res.status(404).json({ message: 'Task not found', data: {} });

            const oldAssigned = task.assignedUser || '';

            task.name = body.name;
            task.description = body.description || '';
            task.deadline = body.deadline;
            task.completed = body.completed === true;
            task.assignedUser = body.assignedUser || '';
            task.assignedUserName =
                body.assignedUserName || (body.assignedUser ? '' : 'unassigned');

            let saved = await task.save();

            if (oldAssigned && oldAssigned !== saved.assignedUser) {
                await User.updateOne(
                    { _id: oldAssigned },
                    { $pull: { pendingTasks: saved._id.toString() } }
                ).exec();
            }
            if (saved.assignedUser && (!oldAssigned || oldAssigned !== saved.assignedUser)) {
                await User.updateOne(
                    { _id: saved.assignedUser },
                    { $addToSet: { pendingTasks: saved._id.toString() } }
                ).exec();
            }

            if (saved.assignedUser && (!saved.assignedUserName || saved.assignedUserName === '')) {
                const u = await User.findById(saved.assignedUser).exec();
                if (u) {
                    saved.assignedUserName = u.name;
                    await saved.save();
                }
            }

            return res.status(200).json({ message: 'Task updated', data: saved });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });

    // DELETE /api/tasks/:id
    router.delete('/tasks/:id', async (req, res) => {
        try {
            const task = await Task.findById(req.params.id).exec();
            if (!task) return res.status(404).json({ message: 'Task not found', data: {} });

            if (task.assignedUser) {
                await User.updateOne(
                    { _id: task.assignedUser },
                    { $pull: { pendingTasks: task._id.toString() } }
                ).exec();
            }

            await Task.deleteOne({ _id: task._id }).exec();
            return res.status(200).json({ message: 'Task deleted', data: {} });
        } catch {
            return res.status(500).json({ message: 'Server error', data: {} });
        }
    });
};
