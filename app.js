const express = require('express'); //importing express used to require express package
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Event = require('./models/event');
const User = require('./models/user');

const app=express();

app.use(bodyParser.json());     //to extract json from incoming request

const events = eventIds=>{
    return Event.find({_id:{$in: eventIds}})
    .then(events =>{
        return events.map(event =>{
            return {
                ...event._doc,
                 _id: event.id,
                 date: new Date(event._doc.date).toISOString(),
                 creator: user.bind(this, event.creator)
                }
        })
    })
    .catch(err=>{
        throw err;
    })
}

const user =userId=>{
    return User
    .findById(userId)
    .then(user=>{
        return {...user._doc, _id:user.id, createdEvents: events.bind(this, user._doc.createdEvents)};
    })
    .catch(err=>{
        throw err;
    })
}

app.use(
    '/graphql', 
    graphqlHTTP({
        schema: buildSchema(`
            type Event{
                _id: ID!
                title: String!
                description: String!
                price: Float!
                date: String!
                creator: User!
            }

            type User{
                _id:ID!
                email:String!
                password:String
                createdEvents: [Event!]
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            input UserInput {
                email: String!
                password: String!
            }
            
            type RootQuery{
                events: [Event!]!
                users: [User!]!
            }
            
            type RootMutation{
                createEvent(eventInput: EventInput): Event
                createUser(userInput: UserInput): User
            }

            schema{
                query:RootQuery
                mutation:RootMutation
            }
    `),

    rootValue: {
        events: ()=>{
            return Event.find()
            .then(events => {
                return events.map(event =>{
                    return {
                         ...event._doc,
                          _id: event.id,
                          creator: user.bind(this, event._doc.creator)
                        };
                });
            })
            .catch(err=>{
                throw err;
            })
        },
        createEvent:(args)=>{
            const event=new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date:new Date(args.eventInput.date),
                creator: '5ccf07cea7e90822a0450394'
            });
            let createdEvent;
            return event
            .save()
            .then(result=>{
                createdEvent={...result._doc, _id: result._doc.toString(), creator: user.bind(this, result._doc.creator)
                 };
                return User.findById('5ccf07cea7e90822a0450394')
            })
            .then(user=>{
                if(!user){
                    throw new Error ('user not found')
                }
                user.createdEvents.push(event);
                return user.save();
            })
            .then(result=>{
                return createdEvent;
            })
            .catch(err=>{
                console.log(err);
                throw err;
            });
        },
        createUser:args=>{
            return User
            .findOne({email: args.userInput.email})
            .then(user=>{
                if(user){
                    throw new Error ('user exists already')
                }
                return bcrypt
                .hash(args.userInput.password, 12)
            })           
            .then(hashedPassword=>{
                const user=new User({
                    email: args.userInput.email,
                    password: hashedPassword
                });
                return user.save();
            })
            .then(result=>{
                return {...result._doc, password:null, _id: result.id};
            })
            .catch(err=>{
                throw err;
            })
        }
    },

    graphiql:true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-9bx0u.mongodb.net/${process.env.MONGO_dB}?retryWrites=true`
).then(()=>{
    app.listen(3000);   
}).catch(err=>{
    console.log(err);
});