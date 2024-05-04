import Vue from 'vue'
import VueRouter from 'vue-router'

// import { defineAsyncComponent } from 'vue'
// const ChatPage = defineAsyncComponent(() => import('../views/chat/ChatPage.vue'))


Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes:[
    {
      path: '/activityDetail',
      component: () => import('../views/user/projectPlanning/activityDetail.vue')
    },
    {
      path: '/workDetail', 
      component: () => import('../views/user/projectPlanning/workDetail.vue')
    },
    {
      path: '/allFile',
      component: () => import('../views/user/document/allFile.vue')
    },
    {
      path:'/allPerson',
      component: () => import('../views/user/projectPlanning/allPerson.vue')
    },
    {
      path:'/allTask',
      component: () => import('../views/user/projectPlanning/allTask.vue')
    },
    {
      path: '/picture',
      component: () => import('../views/user/projectPlanning/picture.vue')
    },
    {
      path: '/userAuth',
      component: () => import('../views/user/projectPlanning/userAuth.vue')
    },
    {
      path:'/plan',
      component: () => import('../views/user/projectPlanning/allProject.vue')
    },
    {
      path: '/allProject',
      component: () => import('../views/user/projectPlanning/allProject.vue')
    },
    {
      path:'/plan/:projid',
      component: () => import('../views/user/projectPlanning/allTask.vue')
    },
    {
      path:'/allProject/allPerson',
      component: () => import('../views/user/projectPlanning/allPerson.vue')
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { requireLogin: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { requireLogin: false }
    },
    // {
    //   path: '/register',
    //   name: 'register',
    //   component: () => import('../views/Register.vue')
    // },
    {
      path: '/dev',
      name: 'dev',
      component: () => import('../views/Dev.vue')
    },
    {
      path: '/dev/:projid/:repoid/:branchname+',
      name: '分支详情',
      component: () => import('../views/dev/Branch.vue')
    },
    {
      path: '/commitReview',
      name: 'commit审查',
      component: () => import('../views/user/reviews/commitReview.vue'),
    },
    {
      path: '/commitReview/:projid/:repoid/:branchname/:commitid+',
      name: 'commit详情',
      component: () => import('../views/user/reviews/Commit.vue')
    },
    {
      path: '/prReview',
      name: 'pr审查',
      component: () => import('../views/user/reviews/prReview.vue'),
    },
    {
      path: '/prReview/:projid/:repoid/:prid+',
      name: 'pr详情',
      component: () => import('../views/user/reviews/PR.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/user/profile.vue')
    },
    {
      path: '/topic',
      name: 'topic',
      component: () => import('../views/user/topic.vue')
    },
    {
      path: '/manager/home',
      name: 'managerHome',
      component: () => import('../views/manager/manager_home.vue')
    },
    {
      path: '/manager/userMessages',
      name: 'userMessages',
      component: () => import('../views/manager/user_messages.vue')
    },
    {
      path: '/manager/projectMessages',
      name: 'projectMessages',
      component: () => import('../views/manager/project_messages.vue')
    },
    {
      path: '/manager/loginMessages',
      name: 'loginMessages',
      component: () => import('../views/manager/user_login_messages.vue')
    },
    {
      path: '/manager/userAuthority',
      name: 'userAuthority',
      component: () => import('../views/manager/user_authority.vue')
    },
    {
      path: '/manager/assistantAuthority',
      name: 'assistAuthority',
      component: () => import('../views/manager/assistant_authority.vue')
    },
    {
      path: '/manager/assistantMessages',
      name: 'assistMessages',
      component: () => import('../views/manager/assistant_messages.vue')
    },
      {
      path: '/manager/teacherMessages',
      name: 'teacherMessages',
      component: () => import('../views/manager/teacher_messages.vue')
    },
    {
      path: '/hidden/corner',
      name: 'hidden corner',
      component: () => import('../views/dev/hidden_corner.vue')
    },
    {
      path: '/user/chat',
      name: 'chat',
      component: () => import('../views/chat/Chat.vue')
    },
    {
      path: '/user/ai/diagnosis',
      name: 'diagnosis',
      component: () => import('../views/user/AI/Diagnosis.vue')
    },
    {
      path: '/user/ai/testdata',
      name: 'testdata',
      component: () => import('../views/user/AI/TestData.vue')
    }, {
      path: '/user/database',
      name: 'database',
      component: () => import('../views/dev/Database.vue')
    },
  ]
})


export default router