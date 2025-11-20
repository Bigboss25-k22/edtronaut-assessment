import prisma from '../db/prisma';
import { HttpError } from '../utils/httpError';

const createSubmision = async (data: { learnerId: string; simulationId: string; }) => {

    const submission = await prisma.submission.create({
        data: {
            learnerId: data.learnerId,
            simulationId: data.simulationId,
            content: '',
            status: 'IN_PROGRESS',
        },
    });

    return submission;
};

const updateSubmission = async (submissionId: string, content: string) => {

    const existingSubmission = await prisma.submission.findUnique({
        where: { id: submissionId },
    });

    if (!existingSubmission) {
        throw new HttpError(404, 'Submission not found');
    }

    if (existingSubmission.status === 'SUBMITTED') {
        throw new HttpError(400, 'Cannot update a submitted submission');
    }

    const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: { content },
    });

    return updatedSubmission;
}

export const SubmissionService = {
    createSubmision,
    updateSubmission
};