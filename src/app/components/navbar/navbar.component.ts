// tslint:disable:max-line-length
import { Component, OnInit, ElementRef, AfterContentChecked, AfterViewInit, AfterViewChecked } from '@angular/core';
// import { ROUTES } from '../sidebar/sidebar.component';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { RequestsService } from '../../services/requests.service';
import { AuthGuard } from '../../core/auth.guard';
import { Router } from '@angular/router';

declare var $: any;

import { Project } from '../../models/project-model';
import { UsersService } from '../../services/users.service';
import { environment } from '../../../environments/environment';
import { isDevMode } from '@angular/core';
import { UploadImageService } from '../../services/upload-image.service';
import { NotifyService } from '../../core/notify.service';
import * as moment from 'moment';
import { ProjectPlanService } from '../../services/project-plan.service';


@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, AfterViewInit, AfterContentChecked, AfterViewChecked {
    private listTitles: any[];
    location: Location;
    private toggleButton: any;
    private sidebarVisible: boolean;
    unservedRequestCount: number;
    currentUserRequestCount: number;

    value: number
    valueText: string;
    lastRequest: any;
    audio: any;
    membersObjectInRequestArray: any;
    currentUserFireBaseUID: string;
    user: any;
    LOCAL_STORAGE_CURRENT_USER: any;
    // CURRENT_USER_UID_IS_BETWEEN_MEMBERS = false;
    // SHOW_NOTIFICATION_FOR_REQUEST_RECIPIENT: boolean;
    LOCAL_STORAGE_LAST_REQUEST_RECIPIENT: string;
    USER_IS_SIGNED_IN: boolean;
    routerLink = 'routerLink="/analytics"'

    notify: any;
    private shown_requests = {};
    private shown_my_requests = {};


    project: Project;
    projectUser_id: string;
    route: string;

    DETECTED_CHAT_PAGE = false;
    // DETECTED_PROJECT_PAGE = false;
    // DETECTED_LOGIN_PAGE = false;
    // DETECTED_SIGNUP_PAGE = false;
    HIDE_PENDING_EMAIL_NOTIFICATION = true;

    DETECTED_USER_PROFILE_PAGE = false;
    CHAT_BASE_URL = environment.chat.CHAT_BASE_URL

    displayLogoutModal = 'none';

    APP_IS_DEV_MODE: boolean;

    userProfileImageExist: boolean;
    userImageHasBeenUploaded: boolean;

    HAS_OPENED_THE_CHAT: boolean;
    IS_AVAILABLE: boolean;
    projectId: string;

    prjct_profile_name: string;
    prjct_trial_expired: boolean;

    prjc_trial_days_left: number;
    prjc_trial_days_left_percentage: number;


    constructor(
        location: Location,
        private element: ElementRef,
        public auth: AuthService,
        public authguard: AuthGuard,
        private translate: TranslateService,
        private requestsService: RequestsService,
        private router: Router,
        private usersService: UsersService,
        private uploadImageService: UploadImageService,
        private notifyService: NotifyService,
        private prjctPlanService: ProjectPlanService
    ) {
        this.location = location;
        this.sidebarVisible = false;
        // this.unservedRequestCount = 0

        console.log('IS DEV MODE ', isDevMode());
        this.APP_IS_DEV_MODE = isDevMode()
    }



    ngOnInit() {
        this.getCurrentProject();
        // tslint:disable-next-line:no-debugger
        // debugger
        // this.listTitles = ROUTES.filter(listTitle => listTitle);


        // SUBSCRIBE TO IS LOGGED IN PUBLISHED BY AUTH GUARD
        // this.authguard.IS_LOGGED_IN.subscribe((islogged: boolean) => {
        //     this.USER_IS_SIGNED_IN = islogged
        //     console.log('>>> >>> USER IS SIGNED IN ', this.USER_IS_SIGNED_IN);

        // })


        this.updateUnservedRequestCount();
        this.updateCurrentUserRequestCount();

        this.notifyLastUnservedRequest();

        this.checkRequestStatusInShown_requests();

        this.getLoggedUser();

        /* REPLACED */
        // this.getLastRequest();
        // this.getUnservedRequestLenght();
        // this.getUnservedRequestLenght_bs();


        this.getProjectUserId();

        // this.detectChatPage();
        this.hidePendingEmailNotification();
        this.detectUserProfilePage();

        this.checkUserImageUploadIsComplete();

        // used when the page is refreshed
        this.checkUserImageExist();

        this.getFromLocalStorageHasOpenedTheChat();
        this.getFromNotifyServiceHasOpenedChat();

        this.getUserAvailability();
        this.hasChangedAvailabilityStatusInSidebar();
        this.hasChangedAvailabilityStatusInUsersComp();
        // this.subscribeToLogoutPressedinSidebarNavMobile();

        this.getProjectPlan();
    } // OnInit



    getUserAvailability() {
        this.usersService.user_is_available_bs.subscribe((user_available) => {
            this.IS_AVAILABLE = user_available;
            console.log('!!! NAVABAR - USER IS AVAILABLE ', this.IS_AVAILABLE);
        });
    }

    hasChangedAvailabilityStatusInSidebar() {
        this.usersService.has_changed_availability_in_sidebar.subscribe((has_changed_availability) => {
            console.log('!!! NAVABAR SUBSCRIBES TO HAS CHANGED AVAILABILITY FROM THE SIDEBAR', has_changed_availability)
            //   this.getAllUsersOfCurrentProject();
        })
    }

    hasChangedAvailabilityStatusInUsersComp() {
        this.usersService.has_changed_availability_in_users.subscribe((has_changed_availability) => {
            console.log('!!! NAVABAR SUBSCRIBES TO HAS CHANGED AVAILABILITY FROM THE USERS COMP', has_changed_availability)
            if (this.project) {
                // this.getProjectUser()
            }
        })
    }

    ngAfterViewInit() {
        const navbar: HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];
        console.log('NAVBAR toggleButton ', this.toggleButton)
    }

    // bs_hasClickedChat IS PUBLISHED WHEN THE USER CLICK THE CHAT BTN FROM SIDEBAR OR HOME
    getFromNotifyServiceHasOpenedChat() {
        this.notifyService.bs_hasClickedChat.subscribe((hasClickedChat) => {
            console.log('NAVBAR - HAS CLICKED CHAT ? ', hasClickedChat);

            if (hasClickedChat === true) {
                this.HAS_OPENED_THE_CHAT = true
            }
        })
    }


    checkUserImageExist() {
        this.usersService.userProfileImageExist.subscribe((image_exist) => {
            console.log('NAVBAR - USER PROFILE EXIST ? ', image_exist);
            this.userProfileImageExist = image_exist;
        });
    }
    checkUserImageUploadIsComplete() {
        this.uploadImageService.imageExist.subscribe((image_exist) => {
            console.log('NAVBAR - IMAGE UPLOADING IS COMPLETE ? ', image_exist);
            this.userImageHasBeenUploaded = image_exist;
        });
    }

    /* DETECT IF IS THE CHAT PAGE */
    detectChatPage() {

        this.router.events.subscribe((val) => {


            if (this.location.path() !== '') {
                this.route = this.location.path();
                // console.log('»> »> »> NAVBAR ROUTE DETECTED »> ', this.route)
                if (this.route === '/chat') {
                    // console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route)
                    this.DETECTED_CHAT_PAGE = true;
                } else {
                    this.DETECTED_CHAT_PAGE = false;
                }
            }
        });
    }

    /**
     * - WHEN IS DETECTED THE PROJECT PAGE OR THE LOGIN PAGE OR THE SIGNUP PAGE  THE "PENDING EMAIL VERIFICATION ALERT " IS NOT DISPLAYED
     */
    hidePendingEmailNotification() {

        this.router.events.subscribe((val) => {

            if (this.location.path() !== '') {
                this.route = this.location.path();
                // console.log('»> »> »> NAVBAR ROUTE DETECTED »> ', this.route)
                if ((this.route === '/projects') || (this.route === '/login') || (this.route === '/signup')) {
                    // console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route)
                    // this.DETECTED_PROJECT_PAGE = true;
                    this.HIDE_PENDING_EMAIL_NOTIFICATION = true;
                    // console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route, 'HIDE PENDING_EMAIL_NOTIFICATION ', this.HIDE_PENDING_EMAIL_NOTIFICATION)
                } else {
                    this.HIDE_PENDING_EMAIL_NOTIFICATION = false;
                    // console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route, 'HIDE PENDING_EMAIL_NOTIFICATION ', this.HIDE_PENDING_EMAIL_NOTIFICATION)
                }

                // if (this.route === '/login') {
                //     console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route)
                //     // this.DETECTED_LOGIN_PAGE = true;
                //     this.HIDE_PENDING_EMAIL_NOTIFICATION = true;
                // } else {
                //     // this.DETECTED_LOGIN_PAGE = false;
                //     this.HIDE_PENDING_EMAIL_NOTIFICATION = false;
                // }

                // if (this.route === '/signup') {
                //     console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route)
                //     // this.DETECTED_SIGNUP_PAGE = true;
                //     this.HIDE_PENDING_EMAIL_NOTIFICATION = true;
                // } else {
                //     // this.DETECTED_SIGNUP_PAGE = false;
                //     this.HIDE_PENDING_EMAIL_NOTIFICATION = false;
                // }

            }
        });
    }

    /**
     * WHEN IS DETECTED THE USER-PROFILE PAGE (NOTE: THE ROUTE '/user-profile' IS THAT IN WHICH THERE IS NOT THE SIDEBAR)
     * TO THE "PENDING EMAIL VERIFICATION ALERT " IS ASIGNED THE CLASS is-user-profile-page THAT MODIFIED THE LEFT POSITION */
    detectUserProfilePage() {
        this.router.events.subscribe((val) => {

            if (this.location.path() !== '') {
                this.route = this.location.path();
                if (this.route === '/user-profile') {

                    this.DETECTED_USER_PROFILE_PAGE = true;
                    // console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route, 'DETECTED_USER_PROFILE_PAGE ', this.DETECTED_USER_PROFILE_PAGE)
                } else {
                    this.DETECTED_USER_PROFILE_PAGE = false;
                    // console.log('»> »> »> NAVBAR ROUTE DETECTED  »> ', this.route, 'DETECTED_USER_PROFILE_PAGE ', this.DETECTED_USER_PROFILE_PAGE)
                }
            }
        });
    }

    getCurrentProject() {
        // this.project = this.auth.project_bs.value;
        this.auth.project_bs.subscribe((project) => {
            if (project) {
                this.project = project
                console.log('!!C-U 00 -> NAVBAR project from AUTH service subscription ', this.project);
                this.projectId = project._id;

                // this.prjct_profile_name = this.project.profile_name;
                // this.prjct_trial_expired = this.project.trial_expired;
                // this.prjc_trial_days_left = this.project.trial_days_left;
                // // this.prjc_trial_days_left_percentage = ((this.prjc_trial_days_left *= -1) * 100) / 30
                // this.prjc_trial_days_left_percentage = (this.prjc_trial_days_left * 100) / 30;

                // // this.prjc_trial_days_left_percentage IT IS 
                // // A NEGATIVE NUMBER AND SO TO DETERMINE THE PERCENT IS MADE AN ADDITION
                // const perc = 100 + this.prjc_trial_days_left_percentage
                // console.log('SIDEBAR project perc ', perc)


                // this.prjc_trial_days_left_percentage = this.round5(perc)
                // console.log('SIDEBAR project trial days left % rounded', this.prjc_trial_days_left_percentage);

            }
        });
    }


    getProjectPlan() {
        this.prjctPlanService.projectPlan$.subscribe((projectProfileData: any) => {
            console.log('ProjectPlanService (navbar) project Profile Data', projectProfileData)
            if (projectProfileData) {
                this.prjct_profile_name = projectProfileData.profile_name;
                this.prjct_trial_expired = projectProfileData.trial_expired;
                this.prjc_trial_days_left = projectProfileData.trial_days_left;
                // this.prjc_trial_days_left_percentage = ((this.prjc_trial_days_left *= -1) * 100) / 30





                if (this.prjct_trial_expired === false) {
                    this.prjc_trial_days_left_percentage = (this.prjc_trial_days_left * 100) / 30;

                    // this.prjc_trial_days_left_percentage IT IS 
                    // A NEGATIVE NUMBER AND SO TO DETERMINE THE PERCENT IS MADE AN ADDITION
                    const perc = 100 + this.prjc_trial_days_left_percentage
                    console.log('ProjectPlanService (navbar) project perc ', perc)

                    this.prjc_trial_days_left_percentage = this.round5(perc);
                    console.log('ProjectPlanService (navbar) trial days left % rounded', this.prjc_trial_days_left_percentage);
                    
                } else if (this.prjct_trial_expired === true) {
                    this.prjc_trial_days_left_percentage = 100;

                }

            }
        })
    }

    round5(x) {
        // const percentageRounded = Math.ceil(x / 5) * 5;
        // console.log('SIDEBAR project trial days left % rounded', percentageRounded);
        // return Math.ceil(x / 5) * 5;
        return x % 5 < 3 ? (x % 5 === 0 ? x : Math.floor(x / 5) * 5) : Math.ceil(x / 5) * 5
    }

    goToPricing() {
        this.router.navigate(['project/' + this.projectId + '/pricing']);
    }

    getLoggedUser() {
        this.auth.user_bs.subscribe((user) => {
            console.log('»»» »»» USER GET IN NAVBAR ', user)
            // tslint:disable-next-line:no-debugger
            // debugger
            this.user = user;
        });
    }


    goToProjects() {
        console.log('HAS CLICCKED GO TO PROJECT ')
        this.router.navigate(['/projects']);

        // (in AUTH SERVICE ) RESET PROJECT_BS AND REMOVE ITEM PROJECT FROM STORAGE WHEN THE USER GO TO PROJECTS PAGE
        this.auth.hasClickedGoToProjects()
        console.log('00 -> NAVBAR project AFTER GOTO PROJECTS ', this.project)
    }

    goToUserProfile() {
        console.log('»»» »»» NAVBAR GO TO USER PROFILE ', this.project)
        if (this.project) {
            this.router.navigate(['/project/' + this.project._id + '/user-profile']);

        }
    }


    // NEW
    updateUnservedRequestCount() {
        this.requestsService.requestsList_bs.subscribe((requests) => {
            if (requests) {
                let count = 0;
                requests.forEach(r => {
                    if (r.support_status === 100) {
                        count = count + 1;
                    }
                });
                this.unservedRequestCount = count;
            }
        });
    }

    updateCurrentUserRequestCount() {
        this.requestsService.requestsList_bs.subscribe((requests) => {
            if (requests) {
                let count = 0;
                requests.forEach(r => {

                    const membersArray = Object.keys(r.members);
                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST currentUserRequestCount membersArray ', membersArray);
                    const currentUserIsInMembers = membersArray.includes(this.user._id);
                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST currentUserRequestCount currentUserIsInMembers ', currentUserIsInMembers);
                    if (currentUserIsInMembers === true) {
                        count = count + 1;
                    }
                });
                this.currentUserRequestCount = count;
                console.log('»» WIDGET notifyLastUnservedRequest REQUEST currentUserRequestCount ', this.currentUserRequestCount);
            }
        });

    }

    // IS USED FOR: A REQUEST CHANGE STATE
    // FROM -> 100 (THE R. RECIPIENT IS ADDED AND SET TO TRUE IN  shown_requests )
    // TO -> 200 (THE R. RECIPIENT IS SET TO FALSE IN  shown_requests )
    // SO IF THE REQUEST CHANGE AGAIN STATUS IN 100 THE NOTICATION IS AGAIN DISPLAYED
    checkRequestStatusInShown_requests() {
        this.requestsService.requestsList_bs.subscribe((requests) => {
            if (requests) {
                requests.forEach(r => {
                    if (r.support_status !== 100) {
                        console.log('REQUEST WITH STATUS != 100 ', r.support_status)
                        this.shown_requests[r.id] = false;
                    }
                });
            }
        });
    }

    /*** from 14 feb are displayed also the request assigned to the current user */
    // NOTE: ARE DISPLAYED IN THE NOTIFICATION ONLY THE UNSERVED REQUEST (support_status = 100)
    // THAT ARE NOT FOUND (OR HAVE THE VALUE FALSE) IN THE LOCAL DICTIONARY shown_requests
    // FURTHERMORE THE NOTICATIONS WILL NOT BE DISPLAYED IF THE USER OBJECT IS NULL (i.e THERE ISN'T USER LOGGED IN)
    notifyLastUnservedRequest() {
        this.requestsService.requestsList_bs.subscribe((requests) => {
            if (requests) {

                requests.forEach(r => {

                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST shown_requests ', this.shown_requests);
                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST shown_my_requests ', this.shown_my_requests);
                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST r ', r);

                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST this.user ID  ', this.user._id);

                    const membersArray = Object.keys(r.members);
                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST membersArray ', membersArray);

                    const currentUserIsInMembers = membersArray.includes(this.user._id);
                    // console.log('»» WIDGET notifyLastUnservedRequest REQUEST currentUserIsInMembers ', currentUserIsInMembers);

                    if (r.support_status === 100 && !this.shown_requests[r.id] && this.user !== null) {

                        const requestCreationDate = moment(r.created_on);
                        // console.log('notifyLastUnservedRequest REQUEST', r.id, ' CREATED ON ', requestCreationDate);
                        // const today = new Date();
                        const currentTime = moment();
                        // console.log('notifyLastUnservedRequest REQUEST TODAY ', currentTime);

                        const dateDiff = currentTime.diff(requestCreationDate, 'h');
                        // console.log('»» WIDGET notifyLastUnservedRequest DATE DIFF ', dateDiff);

                        /**
                         * *** NEW 29JAN19: the unserved requests notifications are not displayed if it is older than one day ***
                         */
                        if (dateDiff < 24) {

                            // this.lastRequest = requests[requests.length - 1];
                            // console.log('!!! »»» LAST UNSERVED REQUEST ', this.lastRequest)

                            // console.log('!!! »»» UNSERVED REQUEST IN BOOTSTRAP NOTIFY ', r)
                            const url = '#/project/' + this.projectId + '/request/' + r.id + '/messages'
                            this.showNotification(
                                '<span style="font-weight: 400; font-family: Google Sans, sans-serif;color:#2d323e!important">' + r.requester_fullname + '</span>' +
                                '<em style="font-family: Google Sans, sans-serif;color:#7695a5!important">' + r.first_text +
                                '</em>' + `<a href="${url}" target="_self" data-notify="url" style="height: 100%; left: 0px; position: absolute; top: 0px; width: 100%; z-index: 1032;"></a>`,
                                3,
                                'border-left-color: rgb(237, 69, 55)',
                                'new-chat-icon-unserved.png'
                            );

                            this.shown_requests[r.id] = true;
                            // console.log('»» WIDGET notifyLastUnservedRequest shown_requests ', this.shown_requests[r.id])
                            // r.notification_already_shown = true;
                        }
                    }

                    if (this.user !== null && !this.shown_my_requests[r.id] && currentUserIsInMembers === true) {

                        const requestCreationDate = moment(r.created_on);
                        const currentTime = moment();

                        const dateDiff = currentTime.diff(requestCreationDate, 'h');
                        // console.log('»» WIDGET notifyLastUnservedRequest currentUserIsInMembers DATE DIFF ', dateDiff);

                        if (dateDiff < 24) {
                            const url = '#/project/' + this.projectId + '/request/' + r.id + '/messages'
                            this.showNotification(
                                '<span style="font-weight: 400; font-family: Google Sans, sans-serif; color:#2d323e!important">' + r.requester_fullname + '</span>' +
                                '<em style="font-family: Google Sans, sans-serif;color:#7695a5!important">' + r.first_text +
                                '</em>' + `<a href="${url}" target="_self" data-notify="url" style="height: 100%; left: 0px; position: absolute; top: 0px; width: 100%; z-index: 1032;"></a>`,
                                4,
                                'border-left-color: rgb(77, 175, 79)',
                                'new-chat-icon-served-by-me.png'
                            );

                            this.shown_my_requests[r.id] = true;
                        }
                    }

                });
                // this.unservedRequestCount = count;
            }
        });
    }


    showNotification(text: string, notificationColor: number, borderColor: string, chatIcon: string) {
        console.log('show notification')
        const type = ['', 'info', 'success', 'warning', 'danger'];

        // const color = Math.floor((Math.random() * 4) + 1);
        // the tree corresponds to the orange
        const color = notificationColor

        // console.log('COLOR ', color)
        // const color = '#ffffff';

        this.notify = $.notify({
            icon: 'notifications',
            // message: 'Welcome to <b>Material Dashboard</b> - a beautiful freebie for every web developer.'
            // this.lastRequest.text + '<br>ID: ' + request_recipient,
            message: text
            // url: 'routerLink="/requests"',
            // url: 'https://github.com/mouse0270/bootstrap-notify',
            // url: '<a routerLink="/requests">',
            // url: this.router.navigate(['/requests']),
            // target: '_self'
            // border-left-color: rgb(255, 179, 40);

        }, {
                type: type[color],
                timer: 2000,
                template:
                    `<div data-notify="container" style="padding:10px!important;background-color:rgb(255, 255, 238);box-shadow:0px 0px 5px rgba(51, 51, 51, 0.3);cursor:pointer;border-left:15px solid;${borderColor}"
                    class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">` +
                    '<button type="button" aria-hidden="true" class="close custom-hover" data-notify="dismiss" style="background-color:beige; padding-right:4px;padding-left:4px;border-radius:50%;">×</button>' +
                    '<div class="row">' +
                    '<div class="col-xs-2 col-sm-2 col-md-2 col-lg-2">' +
                    '<span data-notify="icon" class="notify-icon"> ' + `<img style="width:30px!important"src="assets/img/${chatIcon}" alt="Notify Icon"></span>` +
                    '</div>' +
                    '<div class="col-xs-10 col-sm-10 col-md-10 col-lg-10">' +
                    '<span data-notify="title">{1}</span>' +
                    '<span data-notify="message">{2}</span>' +
                    '</div>' +
                    '</div>' +
                    '</div>'
                // placement: {
                //     from: from,
                //     align: align
                // }
            },
            {
                // onClose: this.test(),
            }
        );

        // if (request_recipient === this.lastRequest.recipient) {
        //     console.log('!! HO GIà VISUALIZZATO NOTIFICA PER QUESTA REQUEST  RR ', request_recipient, 'LRR ', this.lastRequest.recipient)
        //     this.SHOW_NOTIFICATION_FOR_REQUEST_RECIPIENT = false;

        // } else {
        //     this.SHOW_NOTIFICATION_FOR_REQUEST_RECIPIENT = true;
        // }
        // localStorage.setItem(request_recipient, request_recipient);
        // console.log(' -- -- LOCAL STORAGE  SET REQUEST ID ', localStorage.setItem(request_recipient, request_recipient))

        this.audio = new Audio();
        this.audio.src = 'assets/Carme.mp3';
        this.audio.load();
        this.audio.play();

    }

    ngAfterContentChecked() {
        // console.log(' -- --- *** ngAfterContentChecked');
    }

    ngAfterViewChecked() {
        // console.log('++ ++ +++ ngAfterViewChecked');
    }

    sidebarOpen() {
        if (this.toggleButton) {
            const toggleButton = this.toggleButton;
            const body = document.getElementsByTagName('body')[0];
            setTimeout(function () {
                toggleButton.classList.add('toggled');
            }, 500);
            body.classList.add('nav-open');

            this.sidebarVisible = true;
        }
    };
    sidebarClose() {
        // console.log('sidebarClose clicked')
        const body = document.getElementsByTagName('body')[0];
        if (this.toggleButton) {
            this.toggleButton.classList.remove('toggled');
        }
        this.sidebarVisible = false;
        body.classList.remove('nav-open');
    };

    sidebarToggle() {
        console.log('sidebarToggle clicked')
        // const toggleButton = this.toggleButton;
        // const body = document.getElementsByTagName('body')[0];
        if (this.sidebarVisible === false) {
            this.sidebarOpen();
        } else {
            this.sidebarClose();
        }
    };

    getTitle() {
        var titlee = this.location.prepareExternalUrl(this.location.path());
        if (titlee.charAt(0) === '#') {
            titlee = titlee.slice(2);
        }
        titlee = titlee.split('/').pop();

        for (var item = 0; item < this.listTitles.length; item++) {
            if (this.listTitles[item].path === titlee) {
                return this.listTitles[item].title;
            }
        }
        return 'Dashboard';
    }

    getProjectUserId() {
        this.usersService.project_user_id_bs.subscribe((projectUser_id) => {
            console.log('NAV-BAR - PROJECT-USER-ID ', projectUser_id);
            this.projectUser_id = projectUser_id;
        });
    }


    // !! NO MORE USED
    // setUnavailableAndlogout() {
    //     console.log('PRESSED NAVBAR LOGOUT  - PRJ-USER ID ', this.projectUser_id);
    //     if (this.projectUser_id) {
    //         this.usersService.updateProjectUser(this.projectUser_id, false).subscribe((projectUser: any) => {
    //             console.log('PROJECT-USER UPDATED ', projectUser)
    //         },
    //             (error) => {
    //                 console.log('PROJECT-USER UPDATED ERR  ', error);
    //             },
    //             () => {
    //                 console.log('PROJECT-USER UPDATED  * COMPLETE *');
    //                 this.logout();
    //             });
    //     } else {
    //         // this could be the case in which the current user was deleted as a member of the current project
    //         console.log('PRESSED NAVBAR LOGOUT - PRJ-USER ID IS NOT DEFINED - RUN ONLY THE LOGOUT')
    //         this.logout();
    //     }
    // }

    // subscribeToLogoutPressedinSidebarNavMobile() {
    //     this.usersService.has_clicked_logoutfrom_mobile_sidebar.subscribe((has_clicked_logout: boolean) => {
    //         console.log('NAV-BAR - HAS CLICKED LOGOUT IN THE SIDEBAR ', has_clicked_logout);
    //         console.log('NAV-BAR -  SIDEBAR is VISIBILE', this.sidebarVisible);
    //         console.log('NAV-BAR -  USER IS AVAILABLE ', this.IS_AVAILABLE);

    //         if (has_clicked_logout === true) {
    //             this.sidebarClose();
    //             this.openLogoutModal();
    //         }

    //     })
    // };


    openLogoutModal() {
        this.displayLogoutModal = 'block';
        this.auth.hasOpenedLogoutModal(true);
    }

    onCloseModal() {
        this.displayLogoutModal = 'none';
    }

    onCloseLogoutModalHandled() {
        this.displayLogoutModal = 'none';
    }

    onLogoutModalHandled() {
        this.logout();
        this.displayLogoutModal = 'none';
    }

    logout() {
        console.log('RUN LOGOUT FROM NAV-BAR')
        this.auth.showExpiredSessionPopup(false);
        this.auth.signOut();
    }

    testExpiredSessionFirebaseLogout() {
        this.auth.testExpiredSessionFirebaseLogout(true)
    }
    openChat() {
        // localStorage.setItem('chatOpened', 'true');
        const url = this.CHAT_BASE_URL;
        window.open(url, '_blank');
        // this.getFromLocalStorageHasOpenedTheChat();
    }

    getFromLocalStorageHasOpenedTheChat() {
        const storedChatOpenedValue = localStorage.getItem('chatOpened');
        console.log('+ + + STORED CHAT OPENED VALUE ', storedChatOpenedValue);
        if (storedChatOpenedValue && storedChatOpenedValue === 'true') {
            this.HAS_OPENED_THE_CHAT = true;
            console.log('+ + + HAS OPENED THE CHAT ', this.HAS_OPENED_THE_CHAT);
        } else {
            this.HAS_OPENED_THE_CHAT = false;
            console.log('+ + + HAS OPENED THE CHAT ', this.HAS_OPENED_THE_CHAT);
        }
    }
}
