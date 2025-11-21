import prisma from '../db/prisma';
import { HttpError } from '../utils/httpError';

const createSubmision = async (data: { learnerId: string; simulationId: string; }) => {

    const submission = await prisma.submission.create({
        data: {
            learnerId: data.learnerId,
            simulationId: data.simulationId,
            content: { source_code: '', documentation: '' },
            status: 'IN_PROGRESS',
        },
    });

    return submission;
};

const updateSubmission = async (submissionId: string, content: { source_code?: string; documentation?: string }) => {

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

const submitSubmission = async (submissionId: string) => {
    const existing = await prisma.submission.findUnique({
        where: { id: submissionId },
    });

    if (!existing) {
        throw new HttpError(404, 'Submission not found');
    }

    if (existing.status === 'SUBMITTED') {
        throw new HttpError(400, 'Submission has already been submitted');
    }

    const submittedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'SUBMITTED' },
        select: { id: true, status: true },
    });

    return submittedSubmission;
}

export const SubmissionService = {
    createSubmision,
    updateSubmission,
    submitSubmission
};