import { request } from './client.js';
export const surveysApi = {
  login: body => request('/auth/login',{method:'POST',body,publicRequest:true}),
  logout: () => request('/auth/logout',{method:'POST'}),
  templates: () => request('/survey-templates'),
  saveTemplate: (body,id) => request(`/survey-templates${id ? '/'+id : ''}`,{method:id ? 'PUT' : 'POST',body}),
  deleteTemplate: id => request(`/survey-templates/${id}`,{method:'DELETE'}),
  invitations: () => request('/survey-invitations'), requests: () => request('/support-requests'),
  invite: body => request('/survey-invitations',{method:'POST',body}),
  summary: () => request('/reports/summary'),
  publicSurvey: token => request(`/public/surveys/${token}`,{publicRequest:true}),
  respond: (token,body) => request(`/public/surveys/${token}/responses`,{method:'POST',body,publicRequest:true})
};
