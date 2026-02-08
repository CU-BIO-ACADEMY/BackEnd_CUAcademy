import { AuthController } from "../modules/auth/auth.controller";
import { AuthService } from "../modules/auth/auth.service";
import { DrizzleSessionRepository } from "../modules/session/session.repository";
import { SessionService } from "../modules/session/session.service";
import { DrizzleUserRepository } from "../modules/user/user.repository";
import { UserService } from "../modules/user/user.service";
import { DrizzleUserInterestsRepository } from "../modules/user/user-interests.repository";
import { UserInterestsService } from "../modules/user/user-interests.service";
import { DrizzleTagRepository } from "../modules/tags/tags.repository";
import { TagService } from "../modules/tags/tags.service";
import { DrizzleActivityRepository } from "../modules/activities/activities.repository";
import { ActivitiesService } from "../modules/activities/activities.service";
import { DrizzleActivityTagsRepository } from "../modules/activities/activity-tags.repository";
import { ActivityTagsService } from "../modules/activities/activity-tags.service";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { PaymentController } from "../modules/payment/payment.controller";
import { PaymentService } from "../modules/payment/payment.service";
import { EasySlipService } from "../modules/thrid-party/easy-slip/easy-slip.service";
import { DrizzleFileRepository } from "../modules/files/files.repository";
import { FileService } from "../modules/files/files.service";
import { MinioStorage } from "./minio/minio-storage";
import { minioClient } from "./minio";
import { DrizzleTransactionRepository } from "../modules/transaction/transaction.repository";
import { TransactionService } from "../modules/transaction/transaction.service";
import { DrizzleTopupTransactionRepository } from "../modules/transaction/topup-transaction.repository";
import { TopupTransactionService } from "../modules/transaction/topup-transaction.service";
import { ActivityController } from "../modules/activities/activities.controller";
import { TransactionController } from "../modules/transaction/transaction.controller";
import { DrizzleOAuthAccountRepository } from "../modules/oauth-account/oauth-account.repository";
import { OAuthAccountService } from "../modules/oauth-account/oauth-account.service";
import { DrizzleActivityUserRepository } from "../modules/activities/activity-users.repository";
import { ActivityUserService } from "../modules/activities/activity-users.service";
import { DrizzleStudentInformationRepository } from "../modules/student-information/student-information.repository";
import { StudentInformationService } from "../modules/student-information/student-information.service";
import { StudentInformationController } from "../modules/student-information/student-information.controller";

const userRepository = new DrizzleUserRepository();
const userService = new UserService(userRepository);

const sessionRepository = new DrizzleSessionRepository();
const sessionService = new SessionService(sessionRepository, userService);

const oauthAccountRepository = new DrizzleOAuthAccountRepository();
const oauthAccountService = new OAuthAccountService(oauthAccountRepository);

const tagRepository = new DrizzleTagRepository();
const tagService = new TagService(tagRepository);

const userInterestsRepository = new DrizzleUserInterestsRepository();
const userInterestsService = new UserInterestsService(
    userInterestsRepository,
    tagService,
    userService
);

const minioStorage = new MinioStorage(minioClient);
const fileRepository = new DrizzleFileRepository();
const fileService = new FileService(fileRepository, minioStorage);

const activityUserRepository = new DrizzleActivityUserRepository();
const activityUserService = new ActivityUserService(activityUserRepository);

const activityRepository = new DrizzleActivityRepository();
const activitiesService = new ActivitiesService(
    activityRepository,
    activityUserService,
    userService,
    fileService
);
const activityController = new ActivityController(activitiesService);

const activityTagsRepository = new DrizzleActivityTagsRepository();
const activityTagsService = new ActivityTagsService(
    activityTagsRepository,
    activitiesService,
    tagService
);

const authService = new AuthService(sessionService, userService, oauthAccountService);
const authController = new AuthController(authService);

const authMiddleware = new AuthMiddleware(sessionService);

const easySlipService = new EasySlipService();

const transactionRepository = new DrizzleTransactionRepository();
const transactionService = new TransactionService(transactionRepository, userService);
const transactionController = new TransactionController(transactionService);

const topupTransactionRepository = new DrizzleTopupTransactionRepository();
const topupTransactionService = new TopupTransactionService(topupTransactionRepository);

const paymentService = new PaymentService(
    easySlipService,
    fileService,
    transactionService,
    topupTransactionService
);
const paymentController = new PaymentController(paymentService);

const studentInformationRepository = new DrizzleStudentInformationRepository();
const studentInformationService = new StudentInformationService(
    studentInformationRepository,
    userService
);
const studentInformationController = new StudentInformationController(studentInformationService);

export {
    authMiddleware,
    activityController,
    authController,
    paymentController,
    transactionController,
    studentInformationController,
};
