const OPEN_GROUP_KEY = 'onekana:navigation:open-group'

export function getOpenNavigationGroup() {
  return sessionStorage.getItem(OPEN_GROUP_KEY)
}

export function setOpenNavigationGroup(group: string | null) {
  if (group) sessionStorage.setItem(OPEN_GROUP_KEY, group)
  else sessionStorage.removeItem(OPEN_GROUP_KEY)
}
