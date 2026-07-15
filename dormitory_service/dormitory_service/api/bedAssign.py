from django.urls import path
from dormitory_service.view.BedAssignViews import *

urlpatterns = [

    path('/create', BedAssignCreateView.as_view(), name="createAssign"),
    path('/update', BedAssignUpdate.as_view(), name="updateAssign"),
    path('/detail', BedAssignDetail.as_view(), name="detailAssign"),
    path('/current', BedAssignCurrent.as_view(), name="currentAssign"),

]
