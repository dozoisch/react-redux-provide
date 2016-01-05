import providers from '../providers/index';

export default {
  providers,
  providedState: {
    todoList: [
      {
        value: 'Use redux providers',
        completed: true
      }
    ],

    filterMap: new Map([
      ['All', {
        filter: todoItem => true,
        selected: true
      }],
      ['Active', {
        filter: todoItem => !todoItem.completed
      }],
      ['Completed', {
        filter: todoItem => todoItem.completed
      }]
    ])
  }
};
